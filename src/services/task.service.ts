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

export async function findEmployeesByName(
  name: string,
  department?: string | null
): Promise<Employee[]> {
  const result = await pool.query(
    `SELECT id, name, department, role
     FROM employees
     ORDER BY id`
  );

  const normalizedName = normalizeArabic(name);
  const normalizedDepartment = department
    ? normalizeArabic(department)
    : null;

  return result.rows.filter((employee: Employee) => {
    const nameMatches =
      normalizeArabic(employee.name) === normalizedName;

    const departmentMatches =
      !normalizedDepartment ||
      normalizeArabic(employee.department) === normalizedDepartment;

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
}) {
  const {
    sender,
    target,
    description,
    dateExpression,
    timeExpression
  } = params;

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

    return {
      allowed: false as const,
      reply:
        sender.role === "employee"
          ? "لا يمكنك إسناد مهمة لموظف آخر. يمكنك تسجيل مهام لنفسك فقط."
          : "لا يمكنك إسناد مهمة لموظف من قسم آخر."
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
      description || "مهمة جديدة",
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

  const baseReply =
    sender.id === target.id
      ? "تم، سجلت المهمة لك."
      : `تم، أسندت المهمة لـ${target.name}.`;

  const reply = movedFromFriday
    ? `${baseReply} الموعد وافق يوم الجمعة، لذلك تم ترحيله إلى السبت بنفس الوقت.`
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

function formatTasks(rows: any[]): string {
  if (!rows.length) return "لا توجد مهام مطابقة.";

  const lines = rows.map((task, index) => {
    const dueAt = DateTime.fromJSDate(task.due_at)
      .setZone(APP_TIMEZONE)
      .toFormat("yyyy-LL-dd HH:mm");

    return `${index + 1}. ${task.description} - ${task.assignee_name} - ${dueAt}`;
  });

  return lines.join("\n");
}

export async function listTasks(params: {
  sender: Employee;
  scope: ListScope;
  target?: Employee | null;
  targetDepartment?: string | null;
}) {
  const {
    sender,
    scope,
    target,
    targetDepartment
  } = params;

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
        reply: "حدد اسم الموظف المطلوب عرض مهامه."
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
        reply: "لا تملك صلاحية عرض مهام هذا الموظف."
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
        reply: "لا تملك صلاحية عرض مهام هذا القسم."
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
        reply: "لا تملك صلاحية عرض جميع مهام الشركة."
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
        ? "لا توجد مهام مطابقة."
        : `المهام:\n${formatTasks(result.rows)}`
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