import { DateTime } from "luxon";
import { pool } from "../db/pool.js";
import type {
  Employee,
  ListScope
} from "../types/index.js";
import {
  canAssignTask,
  canViewAllTasks,
  canViewDepartment,
  canViewTaskOwner
} from "./authorization.service.js";
import { APP_TIMEZONE, resolveDueDate } from "./date.service.js";
import { normalizeArabic } from "../utils/arabic.js";

export async function getEmployeeById(
  id: number
): Promise<Employee | null> {
  const result = await pool.query(
    `SELECT id, name, department, role
     FROM employees
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

export const EMP_EN_NAMES: Record<string, string> = {
  "منيرة": "Monira",
  "سارة": "Sara",
  "فهد": "Fahad",
  "خالد": "Khaled",
  "نورة": "Noura",
  "عبدالرحمن": "Abdulrahman",
  "أحمد": "Ahmed"
};

export const EMP_AR_NAMES: Record<string, string> = {
  "monira": "منيرة",
  "mounira": "منيرة",
  "munira": "منيرة",
  "sara": "سارة",
  "sarah": "سارة",
  "fahad": "فهد",
  "khaled": "خالد",
  "khalid": "خالد",
  "noura": "نورة",
  "nora": "نورة",
  "abdulrahman": "عبدالرحمن",
  "abdelrahman": "عبدالرحمن",
  "ahmed": "أحمد"
};

export const DEPT_AR_NAMES: Record<string, string> = {
  "management": "الإدارة",
  "projects": "المشاريع",
  "finance": "المالية"
};

export async function findEmployeesByName(
  name: string,
  department?: string | null
): Promise<Employee[]> {
  const result = await pool.query(
    `SELECT id, name, department, role
     FROM employees
     ORDER BY id`
  );

  const rawLowerName = name.trim().toLowerCase();
  const mappedArName = EMP_AR_NAMES[rawLowerName] || name;
  const normalizedName = normalizeArabic(mappedArName);

  let mappedArDept = department;
  if (department) {
    const rawLowerDept = department.trim().toLowerCase();
    mappedArDept = DEPT_AR_NAMES[rawLowerDept] || department;
  }
  const normalizedDepartment = mappedArDept
    ? normalizeArabic(mappedArDept)
    : null;

  return result.rows.filter((employee: Employee) => {
    const empArNorm = normalizeArabic(employee.name);
    const empEnNorm = (EMP_EN_NAMES[employee.name] || "").toLowerCase();

    const nameMatches =
      empArNorm === normalizedName ||
      empEnNorm === rawLowerName;

    const empDeptNorm = normalizeArabic(employee.department);
    const departmentMatches =
      !normalizedDepartment ||
      empDeptNorm === normalizedDepartment;

    return nameMatches && departmentMatches;
  });
}

async function writeAudit(params: {
  actorUserId: number;
  action: string;
  targetUserId?: number | null;
  success: boolean;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await pool.query(
    `INSERT INTO audit_logs
      (actor_user_id, action, target_user_id, success, reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.actorUserId,
      params.action,
      params.targetUserId ?? null,
      params.success,
      params.reason ?? null,
      params.metadata ? JSON.stringify(params.metadata) : null
    ]
  );
}

export async function createTask(params: {
  sender: Employee;
  target: Employee;
  description: string;
  dateExpression?: string | null;
  timeExpression?: string | null;
  lang?: "ar" | "en";
}) {
  const {
    sender,
    target,
    description,
    dateExpression,
    timeExpression,
    lang = "ar"
  } = params;

  const isEn = lang === "en";

  if (!canAssignTask(sender, target)) {
    const reason =
      sender.role === "employee"
        ? "employee_cannot_assign_to_others"
        : "supervisor_cross_department";

    await writeAudit({
      actorUserId: sender.id,
      action: "create_task",
      targetUserId: target.id,
      success: false,
      reason
    });

    let reply = "";
    if (sender.role === "employee") {
      reply = isEn
        ? "You cannot assign tasks to another employee. You can only create tasks for yourself."
        : "لا يمكنك إسناد مهمة لموظف آخر. يمكنك تسجيل مهام لنفسك فقط.";
    } else {
      reply = isEn
        ? "You cannot assign tasks to an employee from another department."
        : "لا يمكنك إسناد مهمة لموظف من قسم آخر.";
    }

    return {
      allowed: false as const,
      reply
    };
  }

  const { dueAt, movedFromFriday } = resolveDueDate(
    dateExpression,
    timeExpression
  );

  const result = await pool.query(
    `INSERT INTO tasks
      (description, assigned_to, created_by, due_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [
      description || (isEn ? "New task" : "مهمة جديدة"),
      target.id,
      sender.id,
      dueAt.toUTC().toISO()
    ]
  );

  await writeAudit({
    actorUserId: sender.id,
    action: "create_task",
    targetUserId: target.id,
    success: true,
    reason: movedFromFriday ? "moved_from_friday" : null,
    metadata: {
      dueAt: dueAt.toISO()
    }
  });

  const targetName = isEn ? (EMP_EN_NAMES[target.name] || target.name) : target.name;
  let baseReply = "";
  if (sender.id === target.id) {
    baseReply = isEn ? "Done, recorded the task for you." : "تم، سجلت المهمة لك.";
  } else {
    baseReply = isEn ? `Done, assigned the task to ${targetName}.` : `تم، أسندت المهمة لـ${target.name}.`;
  }

  const reply = movedFromFriday
    ? (isEn
        ? `${baseReply} The deadline was on a Friday, so it was moved to Saturday at the same time.`
        : `${baseReply} الموعد وافق يوم الجمعة، لذلك تم ترحيله إلى السبت بنفس الوقت.`)
    : baseReply;

  return {
    allowed: true as const,
    taskId: result.rows[0].id as number,
    createdAt: result.rows[0].created_at,
    dueAt: dueAt.toISO(),
    movedFromFriday,
    reply
  };
}

function formatTasks(rows: any[], lang: "ar" | "en" = "ar"): string {
  const isEn = lang === "en";
  if (!rows.length) return isEn ? "No matching tasks found." : "لا توجد مهام مطابقة.";

  const lines = rows.map((task, index) => {
    const dueAt = DateTime.fromJSDate(task.due_at)
      .setZone(APP_TIMEZONE)
      .toFormat("yyyy-LL-dd HH:mm");

    const assigneeName = isEn
      ? (EMP_EN_NAMES[task.assignee_name] || task.assignee_name)
      : task.assignee_name;

    return `${index + 1}. ${task.description} - ${assigneeName} - ${dueAt}`;
  });

  return lines.join("\n");
}

export async function listTasks(params: {
  sender: Employee;
  scope: ListScope;
  target?: Employee | null;
  targetDepartment?: string | null;
  lang?: "ar" | "en";
}) {
  const {
    sender,
    scope,
    target,
    targetDepartment,
    lang = "ar"
  } = params;

  const isEn = lang === "en";

  let query = `
    SELECT
      t.id,
      t.description,
      t.due_at,
      t.status,
      t.created_at,
      e.id AS assignee_id,
      e.name AS assignee_name,
      e.department AS assignee_department
    FROM tasks t
    JOIN employees e ON e.id = t.assigned_to
  `;

  let values: unknown[] = [];

  if (scope === "self") {
    query += " WHERE t.assigned_to = $1";
    values = [sender.id];
  } else if (scope === "employee") {
    if (!target) {
      return {
        allowed: false as const,
        status: "clarification" as const,
        reply: isEn
          ? "Please specify the employee whose tasks you want to view."
          : "حدد اسم الموظف المطلوب عرض مهامه."
      };
    }

    if (!canViewTaskOwner(sender, target)) {
      await writeAudit({
        actorUserId: sender.id,
        action: "list_tasks_employee",
        targetUserId: target.id,
        success: false,
        reason: "insufficient_permissions"
      });

      return {
        allowed: false as const,
        status: "rejected" as const,
        reply: isEn
          ? "You do not have permission to view this employee's tasks."
          : "لا تملك صلاحية عرض مهام هذا الموظف."
      };
    }

    query += " WHERE t.assigned_to = $1";
    values = [target.id];
  } else if (scope === "department") {
    const department =
      targetDepartment || sender.department;

    if (!canViewDepartment(sender, department)) {
      await writeAudit({
        actorUserId: sender.id,
        action: "list_tasks_department",
        success: false,
        reason: "insufficient_permissions",
        metadata: { department }
      });

      return {
        allowed: false as const,
        status: "rejected" as const,
        reply: isEn
          ? "You do not have permission to view this department's tasks."
          : "لا تملك صلاحية عرض مهام هذا القسم."
      };
    }

    query += " WHERE e.department = $1";
    values = [department];
  } else if (scope === "all") {
    if (!canViewAllTasks(sender)) {
      await writeAudit({
        actorUserId: sender.id,
        action: "list_tasks_all",
        success: false,
        reason: "insufficient_permissions"
      });

      return {
        allowed: false as const,
        status: "rejected" as const,
        reply: isEn
          ? "You do not have permission to view all company tasks."
          : "لا تملك صلاحية عرض مهام جميع موظفي الشركة."
      };
    }
  }

  query += " ORDER BY t.due_at ASC, t.id ASC";

  const result = await pool.query(query, values);

  await writeAudit({
    actorUserId: sender.id,
    action: `list_tasks_${scope}`,
    targetUserId: target?.id ?? null,
    success: true,
    metadata: {
      count: result.rows.length,
      targetDepartment: targetDepartment || null
    }
  });

  return {
    allowed: true as const,
    status: "ok" as const,
    tasks: result.rows,
    reply:
      result.rows.length === 0
        ? (isEn ? "No matching tasks found." : "لا توجد مهام مطابقة.")
        : (isEn ? `Tasks:\n${formatTasks(result.rows, lang)}` : `المهام:\n${formatTasks(result.rows, lang)}`)
  };
}

export async function getAllEmployees(): Promise<Employee[]> {
  const result = await pool.query(
    `SELECT id, name, department, role
     FROM employees
     ORDER BY id ASC`
  );
  return result.rows;
}

export async function getRecentAuditLogs(limit = 40) {
  const result = await pool.query(
    `SELECT
       a.id,
       a.action,
       a.success,
       a.reason,
       a.metadata,
       a.created_at,
       e1.name AS actor_name,
       e1.role AS actor_role,
       e2.name AS target_name
     FROM audit_logs a
     LEFT JOIN employees e1 ON e1.id = a.actor_user_id
     LEFT JOIN employees e2 ON e2.id = a.target_user_id
     ORDER BY a.id DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function resetTasksAndLogs() {
  await pool.query("DELETE FROM tasks");
  await pool.query("DELETE FROM audit_logs");
  return { ok: true };
}