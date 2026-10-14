import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { parseMessage } from "../services/llm.service.js";
import { answerPolicyQuestion } from "../services/policy.service.js";
import { DateTime } from "luxon";
import {
  createTask,
  findEmployeesByName,
  getAllEmployees,
  getEmployeeById,
  getRecentAuditLogs,
  listTasks,
  resetTasksAndLogs
} from "../services/task.service.js";
import { APP_TIMEZONE } from "../services/date.service.js";

const router = Router();

const ChatBodySchema = z.object({
  user_id: z.number().int().positive(),
  message: z.string().trim().min(1).max(2000),
  lang: z.enum(["ar", "en"]).optional().default("ar")
});

function ambiguousEmployeeReply(
  name: string,
  employees: Array<{ department: string }>,
  lang: "ar" | "en" = "ar"
): string {
  const departments = [
    ...new Set(employees.map((employee) => employee.department))
  ];

  if (lang === "en") {
    const enDepts = departments.map((d) => {
      if (d === "المشاريع") return "Projects";
      if (d === "المالية") return "Finance";
      if (d === "الإدارة") return "Management";
      return d;
    });
    return `Found more than one employee named ${name}. Please specify the department (${enDepts.join(", ")}).`;
  }

  return `وجدت أكثر من موظف باسم ${name}. وضّح القسم (${departments.join("، ")}).`;
}

router.post("/chat", async (req, res) => {
  try {
    const body = ChatBodySchema.parse(req.body);
    const isEnglish = body.lang === "en" || /^[a-zA-Z0-9\s.,?!'"-:;()]+$/.test(body.message.trim());
    const lang = isEnglish ? "en" : (body.lang || "ar");

    const sender = await getEmployeeById(body.user_id);

    if (!sender) {
      return res.status(404).json({
        action: "error",
        reply: lang === "en" ? "User not found." : "المستخدم غير موجود."
      });
    }

    const parseResult = await parseMessage(body.message);
    const parsed = parseResult.data;

    if (config.logParseSource) {
      console.log(
        `[parser=${parseResult.source}] user=${sender.id} lang=${lang} intent=${parsed.intent}`
      );
    }

    if (parsed.intent === "policy_question") {
      const reply = answerPolicyQuestion(
        parsed.policyQuestion || body.message,
        parsed.policyTopic,
        lang
      );

      return res.json({
        action: "policy_question",
        reply
      });
    }

    if (parsed.intent === "list_tasks") {
      let target = null;

      if (
        parsed.listScope === "employee" &&
        parsed.targetEmployeeName
      ) {
        const matches = await findEmployeesByName(
          parsed.targetEmployeeName,
          parsed.targetDepartment
        );

        if (matches.length === 0) {
          return res.json({
            action: "clarification",
            reply: lang === "en"
              ? `Could not find an employee named ${parsed.targetEmployeeName}. Please clarify the name or department.`
              : `لم أجد موظفًا باسم ${parsed.targetEmployeeName}. وضّح الاسم أو القسم.`
          });
        }

        if (matches.length > 1) {
          return res.json({
            action: "clarification",
            reply: ambiguousEmployeeReply(
              parsed.targetEmployeeName,
              matches,
              lang
            )
          });
        }

        target = matches[0];
      }

      const result = await listTasks({
        sender,
        scope: parsed.listScope || "self",
        target,
        targetDepartment: parsed.targetDepartment,
        lang
      });

      if (!result.allowed) {
        if (result.status === "clarification") {
          return res.json({
            action: "clarification",
            reply: result.reply
          });
        }

        return res.status(403).json({
          action: "rejected",
          reply: result.reply
        });
      }

      return res.json({
        action: "list_tasks",
        tasks: result.tasks,
        reply: result.reply
      });
    }

    if (parsed.intent === "create_task") {
      let target = sender;

      if (parsed.assigneeName) {
        const matches = await findEmployeesByName(
          parsed.assigneeName,
          parsed.assigneeDepartment
        );

        if (matches.length === 0) {
          return res.json({
            action: "clarification",
            reply: lang === "en"
              ? `Could not find an employee named ${parsed.assigneeName}. Could you clarify the name or department?`
              : `لم أجد موظفًا باسم ${parsed.assigneeName}. يُرجى توضيح الاسم أو القسم.`
          });
        }

        if (matches.length > 1) {
          return res.json({
            action: "clarification",
            reply: ambiguousEmployeeReply(
              parsed.assigneeName,
              matches,
              lang
            )
          });
        }

        target = matches[0];
      }

      const result = await createTask({
        sender,
        target,
        description: parsed.description || (lang === "en" ? "New task" : "مهمة جديدة"),
        dateExpression: parsed.dateExpression,
        timeExpression: parsed.timeExpression,
        lang
      });

      if (!result.allowed) {
        return res.status(403).json({
          action: "rejected",
          reply: result.reply
        });
      }

      return res.json({
        action: "create_task",
        task_id: result.taskId,
        reply: result.reply,
        due_at: result.dueAt,
        created_at: result.createdAt,
        moved_from_friday: result.movedFromFriday
      });
    }

    return res.json({
      action: "clarification",
      reply: lang === "en"
        ? "I did not fully understand the request. Could you please clarify?"
        : "لم يتضح لي الطلب بدقة، فضلاً وضّح المطلوب بمزيد من التفصيل."
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        action: "error",
        reply: req.body?.lang === "en" ? "Invalid request." : "الطلب غير صالح.",
        details: error.issues
      });
    }

    console.error(error);

    return res.status(500).json({
      action: "error",
      reply: req.body?.lang === "en" ? "An internal server error occurred." : "حدث خطأ داخلي."
    });
  }
});

router.get("/api/employees", async (_req, res) => {
  try {
    const employees = await getAllEmployees();
    return res.json({ ok: true, employees });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch employees" });
  }
});

router.get("/api/tasks", async (req, res) => {
  try {
    const userId = Number(req.query.user_id || 1);
    const scope = (req.query.scope as any) || "self";
    const sender = await getEmployeeById(userId);

    if (!sender) {
      return res.status(404).json({ ok: false, error: "المستخدم غير موجود" });
    }

    const result = await listTasks({
      sender,
      scope,
      targetDepartment: req.query.department as string | undefined
    });

    if (!result.allowed) {
      return res.status(403).json({ ok: false, reply: result.reply });
    }

    return res.json({ ok: true, tasks: result.tasks });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch tasks" });
  }
});

router.get("/api/audit-logs", async (_req, res) => {
  try {
    const logs = await getRecentAuditLogs(50);
    return res.json({ ok: true, logs });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch audit logs" });
  }
});

router.post("/api/reset", async (_req, res) => {
  try {
    await resetTasksAndLogs();
    return res.json({ ok: true, reply: "تمت إعادة تعيين المهام وسجلات التدقيق بنجاح." });
  } catch (error) {
    console.error("Failed to reset:", error);
    return res.status(500).json({ ok: false, error: "Failed to reset" });
  }
});

router.get("/api/status", async (_req, res) => {
  return res.json({
    ok: true,
    timezone: APP_TIMEZONE,
    now: DateTime.now().setZone(APP_TIMEZONE).toISO(),
    llmProvider: config.llmProvider,
    model: config.llmProvider === "gemini" ? config.geminiModel : config.openaiModel
  });
});

router.get("/api/settings", (_req, res) => {
  return res.json({
    ok: true,
    timezone: APP_TIMEZONE,
    now: DateTime.now().setZone(APP_TIMEZONE).toISO(),
    llmProvider: config.llmProvider,
    model: config.llmProvider === "gemini" ? config.geminiModel : config.openaiModel
  });
});

router.post("/api/settings", (req, res) => {
  try {
    const { model, llmProvider } = req.body;
    if (model && typeof model === "string") {
      config.openaiModel = model.trim();
      if (config.llmProvider === "gemini") {
        config.geminiModel = model.trim();
      }
    }
    if (llmProvider && ["openai", "openrouter", "gemini", "fallback"].includes(llmProvider)) {
      config.llmProvider = llmProvider;
    }
    return res.json({
      ok: true,
      message: "Settings updated successfully",
      llmProvider: config.llmProvider,
      model: config.llmProvider === "gemini" ? config.geminiModel : config.openaiModel
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Failed to update settings" });
  }
});

export default router;