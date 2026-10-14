import type { PolicyTopic } from "../types/index.js";
import { normalizeArabic } from "../utils/arabic.js";

export const POLICY: Record<Exclude<PolicyTopic, "unknown">, string> = {
  working_hours:
    "الدوام من الأحد إلى الخميس من 8:00 صباحًا حتى 4:00 عصرًا، والسبت دوام نصفي حتى 12:00 ظهرًا.",

  annual_leave:
    "طلب الإجازة الاعتيادية قبل 5 أيام عمل على الأقل، ويعتمده المشرف المباشر.",

  sick_leave:
    "الإجازة المرضية تتطلب تقريرًا طبيًا خلال يومين من العودة.",

  remote_work:
    "العمل عن بُعد يوم واحد في الأسبوع بموافقة المشرف.",

  expenses:
    "المصروفات حتى 500 ريال يعتمدها المشرف، وما فوقها المدير.",

  task_status_update:
    "تحديث حالة المهمة يوميًا قبل نهاية الدوام."
};

export function detectPolicyTopic(question: string): PolicyTopic {
  const q = normalizeArabic(question);

  if (q.includes("مرض") && (q.includes("اجاز") || q.includes("عطله"))) {
    return "sick_leave";
  }

  if (
    q.includes("اجاز") ||
    q.includes("عطله") ||
    q.includes("طلب اجازه")
  ) {
    return "annual_leave";
  }

  if (
    q.includes("دوام") ||
    q.includes("ساعات العمل") ||
    q.includes("مواعيد العمل") ||
    q.includes("السبت") ||
    q.includes("الخميس")
  ) {
    return "working_hours";
  }

  if (
    q.includes("عن بعد") ||
    q.includes("ريموت") ||
    q.includes("من البيت")
  ) {
    return "remote_work";
  }

  if (
    q.includes("مصروف") ||
    q.includes("نفقات") ||
    q.includes("500")
  ) {
    return "expenses";
  }

  if (
    q.includes("حاله المهمه") ||
    q.includes("تحديث المهمه") ||
    q.includes("تحديث حالة")
  ) {
    return "task_status_update";
  }

  return "unknown";
}

export function answerPolicyQuestion(
  question: string,
  suggestedTopic?: PolicyTopic | null
): string {
  const deterministicTopic = detectPolicyTopic(question);

  const topic =
    deterministicTopic !== "unknown"
      ? deterministicTopic
      : suggestedTopic || "unknown";

  if (topic === "unknown") {
    return "المعلومة غير متوفرة في السياسة.";
  }

  return POLICY[topic];
}