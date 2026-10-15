import { describe, expect, it } from "vitest";
import {
  parseMessage,
  detectEmployeeTaskQuery
} from "../src/services/llm.service.js";

describe("LLM & Fallback Message Parsing", { timeout: 30000 }, () => {
  it("parses employee task inquiries correctly", async () => {
    const q1 = "هل عبدالرحمن اسندت له مهمة اجتماع مع المالية";
    const emp1 = detectEmployeeTaskQuery(q1);
    expect(emp1).toEqual({ targetName: "عبدالرحمن" });

    const res1 = await parseMessage(q1);
    expect(res1.data.intent).toBe("list_tasks");
    expect(res1.data.listScope).toBe("employee");
    expect(res1.data.targetEmployeeName).toBe("عبدالرحمن");

    const q2 = "هل خالد عنده مهام؟";
    const res2 = await parseMessage(q2);
    expect(res2.data.intent).toBe("list_tasks");
    expect(res2.data.listScope).toBe("employee");
    expect(res2.data.targetEmployeeName).toBe("خالد");

    const q3 = "اعرض مهام فهد";
    const res3 = await parseMessage(q3);
    expect(res3.data.intent).toBe("list_tasks");
    expect(res3.data.listScope).toBe("employee");
    expect(res3.data.targetEmployeeName).toBe("فهد");

    const q4 = "tasks of Abdulrahman";
    const res4 = await parseMessage(q4);
    expect(res4.data.intent).toBe("list_tasks");
    expect(res4.data.listScope).toBe("employee");
    expect(res4.data.targetEmployeeName).toBe("Abdulrahman");

    const q5 = "وش مهام نورا؟";
    const res5 = await parseMessage(q5);
    expect(res5.data.intent).toBe("list_tasks");
    expect(res5.data.listScope).toBe("employee");
    expect(["نورة", "نورا"]).toContain(res5.data.targetEmployeeName);

    const q6 = "هل عبدالرحمان عنده مهام؟";
    const res6 = await parseMessage(q6);
    expect(res6.data.intent).toBe("list_tasks");
    expect(res6.data.listScope).toBe("employee");
    expect(["عبدالرحمن", "عبدالرحمان"]).toContain(res6.data.targetEmployeeName);
  });

  it("parses task status update policy question without confusing with self tasks", async () => {
    const q = "متى لازم أحدث حالة مهامي في النظام؟";
    const res = await parseMessage(q);
    expect(res.data.intent).toBe("policy_question");
    expect(res.data.policyTopic).toBe("task_status_update");
  });

  it("still parses explicit self tasks correctly", async () => {
    const res1 = await parseMessage("وش مهامي؟");
    expect(res1.data.intent).toBe("list_tasks");
    expect(res1.data.listScope).toBe("self");

    const res2 = await parseMessage("اعرض مهامي");
    expect(res2.data.intent).toBe("list_tasks");
    expect(res2.data.listScope).toBe("self");

    const res3 = await parseMessage("my tasks");
    expect(res3.data.intent).toBe("list_tasks");
    expect(res3.data.listScope).toBe("self");
  });

  it("still preserves task creation commands without confusing as queries", async () => {
    const res1 = await parseMessage("سجل مهمة لخالد بكرة الساعة 10 يراجع عرض السعر");
    expect(res1.data.intent).toBe("create_task");
    expect(["خالد", "Khaled"]).toContain(res1.data.assigneeName);

    const res2 = await parseMessage("سجل لعبدالرحمن اجتماع مع المالية بعد بكرة 1 الظهر");
    expect(res2.data.intent).toBe("create_task");
    expect(["عبدالرحمن", "Abdulrahman"]).toContain(res2.data.assigneeName);
  });

  it("parses dialect relative dates like كمان 3 ايام and عقب باكر correctly", async () => {
    const res1 = await parseMessage("سجل مهمة لخالد كمان 3 ايام يراجع عرض السعر");
    expect(res1.data.intent).toBe("create_task");
    expect(["خالد", "Khaled"]).toContain(res1.data.assigneeName);
    expect(["كمان 3 ايام", "كمان 3 أيام"]).toContain(res1.data.dateExpression);
    expect(res1.data.description).toBe("يراجع عرض السعر");

    const res2 = await parseMessage("سجل مهمة كمان ٣ ايام يراجع العقد");
    expect(res2.data.intent).toBe("create_task");
    expect(["كمان ٣ ايام", "كمان 3 ايام", "كمان 3 أيام", "كمان ٣ أيام"]).toContain(res2.data.dateExpression);
  });
});
