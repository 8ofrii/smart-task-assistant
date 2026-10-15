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
});
