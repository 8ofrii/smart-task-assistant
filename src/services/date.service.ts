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

const WORD_HOURS: [string, number][] = [
  // 11 and 12 first (compounds before individual numbers)
  ["الحادية عشرة", 11],
  ["الحادية عشر", 11],
  ["حادية عشرة", 11],
  ["حادية عشر", 11],
  ["حادي عشر", 11],
  ["إحدى عشرة", 11],
  ["احدى عشر", 11],
  ["حداشر", 11],
  ["eleven", 11],

  ["الثانية عشرة", 12],
  ["الثانية عشر", 12],
  ["ثانية عشرة", 12],
  ["ثانية عشر", 12],
  ["ثاني عشر", 12],
  ["اثنا عشر", 12],
  ["اثني عشر", 12],
  ["اثنتا عشرة", 12],
  ["اتناشر", 12],
  ["twelve", 12],

  // 1 to 10
  ["الواحدة", 1],
  ["واحدة", 1],
  ["واحد", 1],
  ["one", 1],

  ["الثانية", 2],
  ["ثانية", 2],
  ["تانية", 2],
  ["اثنتين", 2],
  ["اثنين", 2],
  ["اتنين", 2],
  ["two", 2],

  ["الثالثة", 3],
  ["ثالثة", 3],
  ["تالتة", 3],
  ["ثلاثة", 3],
  ["تلاتة", 3],
  ["three", 3],

  ["الرابعة", 4],
  ["رابعة", 4],
  ["أربعة", 4],
  ["اربعة", 4],
  ["four", 4],

  ["الخامسة", 5],
  ["خامسة", 5],
  ["خمسة", 5],
  ["five", 5],

  ["السادسة", 6],
  ["سادسة", 6],
  ["ستة", 6],
  ["six", 6],

  ["السابعة", 7],
  ["سابعة", 7],
  ["سبعة", 7],
  ["seven", 7],

  ["الثامنة", 8],
  ["ثامنة", 8],
  ["تامنة", 8],
  ["ثمانية", 8],
  ["تمانية", 8],
  ["eight", 8],

  ["التاسعة", 9],
  ["تاسعة", 9],
  ["تسعة", 9],
  ["nine", 9],

  ["العاشرة", 10],
  ["عاشرة", 10],
  ["عشرة", 10],
  ["ten", 10]
];

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
  const normalized = normalizeArabic(arabicDigitsToEnglish(value)).toLowerCase();

  let hour: number | null = null;
  let minute = 0;

  // 1. Digital time like "10:30" or "4:15" or "10"
  const digitMatch = normalized.match(/(?:^|\D)(\d{1,2})(?::(\d{1,2}))?(?:\D|$)/);
  if (digitMatch) {
    hour = Number(digitMatch[1]);
    if (digitMatch[2] !== undefined) {
      minute = Number(digitMatch[2]);
    }
  }

  // 2. Word-based hours (e.g. "الرابعة", "العاشرة", "four")
  if (hour === null) {
    for (const [word, num] of WORD_HOURS) {
      const normWord = normalizeArabic(word).toLowerCase();
      if (normalized.includes(normWord)) {
        hour = num;
        break;
      }
    }
  }

  // 3. Fallbacks for period-only mentions (when no explicit hour number was given)
  if (hour === null) {
    if (normalized.includes("العصر") || normalized.includes("عصر") || raw.includes("afternoon")) return { hour: 15, minute: 0 };
    if (normalized.includes("الظهر") || normalized.includes("ظهر") || raw.includes("noon")) return { hour: 13, minute: 0 };
    if (normalized.includes("الصبح") || normalized.includes("صباح") || raw.includes("morning")) return { hour: 9, minute: 0 };
    if (normalized.includes("المغرب") || normalized.includes("مغرب")) return { hour: 18, minute: 0 };
    if (normalized.includes("العشاء") || normalized.includes("عشاء") || raw.includes("night")) return { hour: 20, minute: 0 };
    return { hour: 9, minute: 0 };
  }

  // 4. Word-based fractions / minutes (if minute was not given in digits)
  if (minute === 0) {
    if (normalized.includes("الا ربع") || normalized.includes("إلا ربع")) {
      minute = 45;
      hour = (hour + 11) % 12 || 12;
    } else if (normalized.includes("الا ثلث") || normalized.includes("إلا ثلث") || normalized.includes("الا تلت")) {
      minute = 40;
      hour = (hour + 11) % 12 || 12;
    } else if (normalized.includes("الا عشره") || normalized.includes("الا عشر")) {
      minute = 50;
      hour = (hour + 11) % 12 || 12;
    } else if (normalized.includes("الا خمسه") || normalized.includes("الا خمس")) {
      minute = 55;
      hour = (hour + 11) % 12 || 12;
    } else if (normalized.includes("نصف") || normalized.includes("نص") || raw.includes("half")) {
      minute = 30;
    } else if (normalized.includes("ربع") || raw.includes("quarter")) {
      minute = 15;
    } else if (normalized.includes("ثلث") || normalized.includes("تلت")) {
      minute = 20;
    } else {
      const minMatch = normalized.match(/و\s*(\d{1,2})/);
      if (minMatch) {
        minute = Number(minMatch[1]);
      }
    }
  }

  // 5. AM / PM determination
  const isPm =
    /(^|\s)(م|مساء|مساءا|مساءً|عصر|عصرا|عصراً|العصر|بالليل|ليل|ليلا|ليلاً|المغرب|مغرب|العشاء|عشاء)(\s|$)/u.test(
      normalized
    ) ||
    raw.includes("pm") ||
    raw.includes("p.m.") ||
    (normalized.includes("الظهر") && hour !== 12);

  const isAm =
    /(^|\s)(ص|صباح|صباحا|صباحاً|بالصبح|الصبح|فجر|فجرا|فجراً)(\s|$)/u.test(
      normalized
    ) ||
    raw.includes("am") ||
    raw.includes("a.m.");

  if (isPm) {
    if (hour < 12) hour += 12;
  } else if (isAm) {
    if (hour === 12) hour = 0;
  }

  if (hour === 12 && (normalized.includes("ليل") || raw.includes("midnight"))) {
    hour = 0;
  }

  if (hour > 23 || minute > 59) throw new Error(`Invalid time expression: ${value}`);

  return { hour, minute };
}

function resolveRelativeDate(dateText: string, now: DateTime): DateTime {
  const date = now.startOf("day");
  const lower = dateText.toLowerCase();
  const normalized = normalizeArabic(dateText);

  // ISO or numeric dates like 2026-10-25 or 25/10/2026
  const isoMatch = dateText.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const parsed = DateTime.fromObject(
      { year: Number(isoMatch[1]), month: Number(isoMatch[2]), day: Number(isoMatch[3]) },
      { zone: APP_TIMEZONE }
    );
    if (parsed.isValid) return parsed.startOf("day");
  }

  const dmyMatch = dateText.match(/\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{4}))?\b/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = dmyMatch[3] ? Number(dmyMatch[3]) : now.year;
    const parsed = DateTime.fromObject({ year, month, day }, { zone: APP_TIMEZONE });
    if (parsed.isValid) return parsed.startOf("day");
  }

  if (
    normalized.includes("بعد بكره") ||
    normalized.includes("بعد بكرة") ||
    normalized.includes("بعد غد") ||
    lower.includes("day after tomorrow") ||
    lower.includes("after tomorrow")
  ) return date.plus({ days: 2 });

  if (
    normalized.includes("بكره") ||
    normalized.includes("بكرة") ||
    normalized.includes("باكر") ||
    normalized.includes("غدا") ||
    normalized === "غد" ||
    lower.includes("tomorrow")
  ) return date.plus({ days: 1 });

  if (
    normalized.includes("اليوم") ||
    lower.includes("today") ||
    dateText === ""
  ) return date;

  const weekdayEntry = Object.entries(WEEKDAYS).find(([dayName]) =>
    lower.includes(dayName) ||
    dateText.includes(dayName) ||
    normalized.includes(normalizeArabic(dayName))
  );

  if (weekdayEntry) {
    const [, weekday] = weekdayEntry;
    const explicitlyNext =
      normalized.includes("الجاي") ||
      normalized.includes("القادم") ||
      normalized.includes("المقبل") ||
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
