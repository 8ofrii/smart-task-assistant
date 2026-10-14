import { DateTime } from "luxon";
import { arabicDigitsToEnglish, normalizeArabic } from "../utils/arabic.js";

export const APP_TIMEZONE = "Asia/Riyadh";

export interface DateResolution {
  dueAt: DateTime;
  movedFromFriday: boolean;
}

const WEEKDAYS: Record<string, number> = {
  "الاثنين": 1,
  "الاتنين": 1,
  "monday": 1,
  "الثلاثاء": 2,
  "tuesday": 2,
  "الاربعاء": 3,
  "wednesday": 3,
  "الخميس": 4,
  "thursday": 4,
  "الجمعه": 5,
  "الجمعة": 5,
  "friday": 5,
  "السبت": 6,
  "saturday": 6,
  "الاحد": 7,
  "الأحد": 7,
  "sunday": 7
};

function nextStrictWeekday(base: DateTime, weekday: number): DateTime {
  let date = base.plus({ days: 1 }).startOf("day");
  while (date.weekday !== weekday) date = date.plus({ days: 1 });
  return date;
}

function nextOrSameWeekday(base: DateTime, weekday: number): DateTime {
  let date = base.startOf("day");
  while (date.weekday !== weekday) date = date.plus({ days: 1 });
  return date;
}

export function parseTime(value?: string | null): { hour: number; minute: number } {
  if (!value) return { hour: 9, minute: 0 };

  const raw = value.trim().toLowerCase();
  const normalized = normalizeArabic(arabicDigitsToEnglish(value));

  if (normalized.includes("العصر") || raw.includes("afternoon")) return { hour: 15, minute: 0 };
  if (normalized.includes("الظهر") || normalized.includes("ظهر") || raw.includes("noon")) return { hour: 13, minute: 0 };
  if (normalized.includes("الصبح") || normalized.includes("صباح") || raw.includes("morning")) return { hour: 9, minute: 0 };
  if (normalized.includes("المغرب") || normalized.includes("مغرب")) return { hour: 18, minute: 0 };
  if (normalized.includes("العشاء") || normalized.includes("عشاء") || raw.includes("night")) return { hour: 20, minute: 0 };

  const match = normalized.match(/(\d{1,2})(?::(\d{1,2}))?/);
  if (!match) return { hour: 9, minute: 0 };

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);

  const pm = /(^|\s)(م|مساء|مساءا|بالليل|ليل|ليلا)(\s|$)/.test(normalized) || raw.includes("pm");
  const am = /(^|\s)(ص|صباح|صباحا)(\s|$)/.test(normalized) || raw.includes("am");

  if (pm && hour < 12) hour += 12;
  if (am && hour === 12) hour = 0;

  if (hour > 23 || minute > 59) throw new Error(`Invalid time expression: ${value}`);

  return { hour, minute };
}

function resolveRelativeDate(dateText: string, now: DateTime): DateTime {
  const date = now.startOf("day");
  const lower = dateText.toLowerCase();

  if (
    dateText.includes("بعد بكره") ||
    dateText.includes("بعد بكرة") ||
    lower.includes("day after tomorrow") ||
    lower.includes("after tomorrow")
  ) return date.plus({ days: 2 });

  if (
    dateText.includes("بكره") ||
    dateText.includes("بكرة") ||
    dateText === "غد" ||
    dateText.includes("غدا") ||
    lower.includes("tomorrow")
  ) return date.plus({ days: 1 });

  if (
    dateText.includes("اليوم") ||
    lower.includes("today") ||
    dateText === ""
  ) return date;

  const weekdayEntry = Object.entries(WEEKDAYS).find(([dayName]) =>
    lower.includes(dayName) || dateText.includes(dayName)
  );

  if (weekdayEntry) {
    const [, weekday] = weekdayEntry;
    const explicitlyNext =
      dateText.includes("الجاي") ||
      dateText.includes("القادم") ||
      dateText.includes("المقبل") ||
      lower.includes("next");

    return explicitlyNext
      ? nextStrictWeekday(date, weekday)
      : nextOrSameWeekday(date, weekday);
  }

  return date;
}

export function resolveDueDate(
  dateExpression?: string | null,
  timeExpression?: string | null,
  now = DateTime.now().setZone(APP_TIMEZONE)
): DateResolution {
  const rawDateText = (dateExpression || "اليوم").trim();
  const { hour, minute } = parseTime(timeExpression);

  let dueAt = resolveRelativeDate(rawDateText, now).set({
    hour, minute, second: 0, millisecond: 0
  });

  let movedFromFriday = false;
  if (dueAt.weekday === 5) {
    dueAt = dueAt.plus({ days: 1 });
    movedFromFriday = true;
  }

  return { dueAt, movedFromFriday };
}
