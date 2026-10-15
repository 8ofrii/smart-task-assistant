import { describe, expect, it } from "vitest";
import {
  answerPolicyQuestion,
  detectPolicyTopic
} from "../src/services/policy.service.js";

describe("policy grounding", () => {
  it("answers annual leave from the provided policy", () => {
    const answer = answerPolicyQuestion(
      "كم يوم لازم أقدم قبل الإجازة؟"
    );

    expect(answer).toContain("5 أيام عمل");
    expect(answer).toContain("المشرف المباشر");
  });

  it("does not invent housing allowance", () => {
    expect(
      answerPolicyQuestion("كم بدل السكن للموظفين؟")
    ).toBe("المعلومة غير متوفرة في السياسة.");
  });

  it("detects sick leave separately", () => {
    expect(
      detectPolicyTopic("ما المطلوب للإجازة المرضية؟")
    ).toBe("sick_leave");
  });

  it("answers policy questions in English when requested", () => {
    const answer = answerPolicyQuestion(
      "How many days before leave do I have to submit?",
      null,
      "en"
    );
    expect(answer).toContain("5 business days");

    const housing = answerPolicyQuestion(
      "What is the housing allowance for employees?",
      null,
      "en"
    );
    expect(housing).toBe("This information is not available in the company policy.");
  });

  it("answers task status update policy question (Rule 6)", () => {
    const question = "متى لازم أحدث حالة مهامي في النظام؟";
    expect(detectPolicyTopic(question)).toBe("task_status_update");

    const answer = answerPolicyQuestion(question);
    expect(answer).toBe("تحديث حالة المهمة يوميًا قبل نهاية الدوام.");

    const answerEn = answerPolicyQuestion("When do I update my task status?", null, "en");
    expect(answerEn).toBe("Task status must be updated daily before the end of the workday.");
  });
});