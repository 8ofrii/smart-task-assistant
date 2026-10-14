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
  "الثلاثاء": 2,
  "الاربعاء": 3,
  "الخميس": 4,
  "الجمعه": 5,
  "السبت": 6,
  "الاحد": 7
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

  const normalized = normalizeArabic(arabicDigitsToEnglish(value));

  if (normalized.includes("العصر")) return { hour: 15, minute: 0 };
  if (normalized.includes("الظهر") || normalized.includes("ظهر")) return { hour: 13, minute: 0 };
  if (normalized.includes("الصبح") || normalized.includes("صباح")) return { hour: 9, minute: 0 };
  if (normalized.includes("المغرب") || normalized.includes("مغرب")) return { hour: 18, minute: 0 };
  if (normalized.includes("العشاء") || normalized.includes("عشاء")) return { hour: 20, minute: 0 };

  const match = normalized.match(/(\d{1,2})(?::(\d{1,2}))?/);
  if (!match) return { hour: 9, minute: 0 };

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);

  const pm = /(^|\s)(م|مساء|مساءا|بالليل|ليل|ليلا)(\s|$)/.test(normalized);
  const am = /(^|\s)(ص|صباح|صباحا)(\s|$)/.test(normalized);

  if (pm && hour < 12) hour += 12;
  if (am && hour === 12) hour = 0;

  if (hour > 23 || minute > 59) throw new Error(`Invalid time expression: ${value}`);

  return { hour, minute };
}

function resolveRelativeDate(dateText: string, now: DateTime): DateTime {
  const date = now.startOf("day");

  if (dateText.includes("بعد بكره") || dateText.includes("بعد بكرة")) return date.plus({ days: 2 });

  if (
    dateText.includes("بكره") ||
    dateText.includes("بكرة") ||
    dateText === "غد" ||
    dateText.includes("غدا")
  ) return date.plus({ days: 1 });

  if (dateText.includes("اليوم") || dateText === "") return date;

  const weekdayEntry = Object.entries(WEEKDAYS).find(([dayName]) => dateText.includes(dayName));

  if (weekdayEntry) {
    const [, weekday] = weekdayEntry;
    const explicitlyNext =
      dateText.includes("الجاي") ||
      dateText.includes("القادم") ||
      dateText.includes("المقبل");

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
  const normalizedDateText = normalizeArabic(dateExpression || "اليوم");
  const { hour, minute } = parseTime(timeExpression);

  let dueAt = resolveRelativeDate(normalizedDateText, now).set({
    hour, minute, second: 0, millisecond: 0
  });

  let movedFromFriday = false;
  if (dueAt.weekday === 5) {
    dueAt = dueAt.plus({ days: 1 });
    movedFromFriday = true;
  }

  return { dueAt, movedFromFriday };
}
