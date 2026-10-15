import type { PolicyTopic } from "../types/index.js";
import { normalizeArabic } from "../utils/arabic.js";

export const POLICY_AR: Record<Exclude<PolicyTopic, "unknown">, string> = {
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

export const POLICY_EN: Record<Exclude<PolicyTopic, "unknown">, string> = {
  working_hours:
    "Working hours are Sunday through Thursday from 8:00 AM to 4:00 PM, and Saturday half-day until 12:00 PM.",

  annual_leave:
    "Annual leave must be requested at least 5 business days in advance and approved by the direct supervisor.",

  sick_leave:
    "Sick leave requires an official medical report within 2 days of return.",

  remote_work:
    "Remote work is allowed one day per week with supervisor approval.",

  expenses:
    "Expenses up to 500 SAR are approved by the supervisor; amounts above require manager approval.",

  task_status_update:
    "Task status must be updated daily before the end of the workday."
};

export const POLICY = POLICY_AR;

export function detectPolicyTopic(question: string): PolicyTopic {
  const q = normalizeArabic(question);
  const qEn = question.toLowerCase();

  if (
    (q.includes("مرض") && (q.includes("اجاز") || q.includes("عطله"))) ||
    qEn.includes("sick leave") ||
    (qEn.includes("sick") && qEn.includes("leave")) ||
    qEn.includes("medical report")
  ) {
    return "sick_leave";
  }

  if (
    q.includes("اجاز") ||
    q.includes("عطله") ||
    q.includes("طلب اجازه") ||
    qEn.includes("annual leave") ||
    qEn.includes("vacation") ||
    qEn.includes("days before leave") ||
    qEn.includes("request leave") ||
    (qEn.includes("days") && qEn.includes("leave"))
  ) {
    return "annual_leave";
  }

  if (
    q.includes("دوام") ||
    q.includes("ساعات العمل") ||
    q.includes("مواعيد العمل") ||
    q.includes("السبت") ||
    q.includes("الخميس") ||
    qEn.includes("working hours") ||
    qEn.includes("work hours") ||
    qEn.includes("office hours") ||
    qEn.includes("hours of work") ||
    qEn.includes("shift")
  ) {
    return "working_hours";
  }

  if (
    q.includes("عن بعد") ||
    q.includes("ريموت") ||
    q.includes("من البيت") ||
    qEn.includes("remote work") ||
    qEn.includes("remote") ||
    qEn.includes("work from home") ||
    qEn.includes("wfh")
  ) {
    return "remote_work";
  }

  if (
    q.includes("مصروف") ||
    q.includes("نفقات") ||
    q.includes("500") ||
    qEn.includes("expense") ||
    qEn.includes("expenses") ||
    (qEn.includes("allowance") && qEn.includes("500"))
  ) {
    return "expenses";
  }

  if (
    q.includes("حاله المهمه") ||
    q.includes("تحديث المهمه") ||
    q.includes("تحديث حالة") ||
    q.includes("تحديث حاله") ||
    q.includes("احدث حاله") ||
    q.includes("احدث حالة") ||
    q.includes("احدث مهامي") ||
    q.includes("تحديث مهامي") ||
    q.includes("تحديث المهام") ||
    q.includes("حاله مهامي") ||
    q.includes("حالة مهامي") ||
    (q.includes("احدث") && (q.includes("حاله") || q.includes("مهم") || q.includes("نظام"))) ||
    (q.includes("تحديث") && (q.includes("حاله") || q.includes("مهم") || q.includes("نظام"))) ||
    qEn.includes("task status") ||
    qEn.includes("update task") ||
    qEn.includes("update my task") ||
    (qEn.includes("update") && (qEn.includes("status") || qEn.includes("task")))
  ) {
    return "task_status_update";
  }

  return "unknown";
}

export function answerPolicyQuestion(
  question: string,
  suggestedTopic?: PolicyTopic | null,
  lang: "ar" | "en" = "ar"
): string {
  const deterministicTopic = detectPolicyTopic(question);

  const topic =
    deterministicTopic !== "unknown"
      ? deterministicTopic
      : suggestedTopic || "unknown";

  if (topic === "unknown") {
    return lang === "en"
      ? "This information is not available in the company policy."
      : "المعلومة غير متوفرة في السياسة.";
  }

  return lang === "en" ? POLICY_EN[topic] : POLICY_AR[topic];
}