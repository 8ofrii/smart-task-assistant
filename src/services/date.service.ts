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

// Multi-day & relative date phrases pattern
export const RELATIVE_DATE_PATTERN =
  /(?:(?:بعد|خلال|في\s*خلال|في\s*غضون|كمان|عقب|ورا|قدام)\s*(?:[٠-٩0-9]+|واحد|واحدة|اثنين|اتنين|يومين|ثلاثة|ثلاث|تلاتة|تلات|اربعة|اربع|أربعة|أربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثمان|تمانية|تمان|تسعة|تسع|عشرة|عشر)\s*(?:أيام|ايام|يوم|اسابيع|أسابيع|اسبوع|أسبوع|اشهر|أشهر|شهور|شهر)?|(?:بعد|كمان|عقب)\s+(?:اسبوعين|أسبوعين|اسبوع|أسبوع|يومين|شهرين|شهر|يوم)|(?:عقب|بعد)\s+(?:باكر|باجر|بكره|بكرة|غد)|(?:[٠-٩0-9]+|ثلاثة|ثلاث|تلاتة|تلات|اربعة|اربع|أربعة|أربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثمان|تمانية|تمان|تسعة|تسع|عشرة|عشر)\s*(?:أيام|ايام|يوم|اسابيع|أسابيع|اسبوع|أسبوع)|in\s+\d+\s+(?:days?|weeks?|months?)|after\s+\d+\s+(?:days?|weeks?|months?))/i;

export function extractDateExpression(message: string): string | null {
  const normalized = normalizeArabic(message);
  const lower = message.toLowerCase();

  // 1. Relative phrases with prefixes (كمان, بعد, عقب, خلال, etc.)
  const match = message.match(RELATIVE_DATE_PATTERN);
  if (match) {
    return match[0].trim();
  }

  // 2. Day after tomorrow
  if (
    normalized.includes("بعد بكره") ||
    normalized.includes("بعد بكرة") ||
    normalized.includes("بعد باكر") ||
    normalized.includes("بعد باجر") ||
    normalized.includes("عقب باكر") ||
    normalized.includes("عقب باجر") ||
    normalized.includes("عقب بكره") ||
    normalized.includes("عقب بكرة") ||
    normalized.includes("بعد غد") ||
    lower.includes("day after tomorrow") ||
    lower.includes("after tomorrow")
  ) {
    return "بعد بكرة";
  }

  // 3. Tomorrow
  if (
    normalized.includes("بكره") ||
    normalized.includes("بكرة") ||
    normalized.includes("باكر") ||
    normalized.includes("باجر") ||
    normalized.includes("غدا") ||
    lower.includes("tomorrow")
  ) {
    return "بكرة";
  }

  // 4. Weekdays
  for (const [dayName] of Object.entries(WEEKDAYS)) {
    const normDay = normalizeArabic(dayName);
    if (normalized.includes(normDay) || lower.includes(dayName)) {
      if (
        normalized.includes(`${normDay} الجاي`) ||
        normalized.includes(`${normDay} القادم`) ||
        lower.includes(`next ${dayName}`)
      ) {
        return `${dayName} الجاي`;
      }
      return dayName;
    }
  }

  // 5. Today
  if (
    normalized.includes("اليوم") ||
    normalized.includes("النهارده") ||
    lower.includes("today")
  ) {
    return "اليوم";
  }

  return null;
}

export function resolveRelativeDate(dateText: string, now: DateTime): DateTime {
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

  const arabicNumText = arabicDigitsToEnglish(normalized);

  // Two weeks
  if (
    normalized.includes("بعد اسبوعين") ||
    normalized.includes("بعد أسبوعين") ||
    normalized.includes("كمان اسبوعين") ||
    normalized.includes("كمان أسبوعين") ||
    normalized.includes("عقب اسبوعين") ||
    normalized.includes("عقب أسبوعين") ||
    lower.includes("after two weeks") ||
    lower.includes("in two weeks")
  ) return date.plus({ weeks: 2 });

  // One week
  if (
    normalized.includes("بعد اسبوع") ||
    normalized.includes("بعد أسبوع") ||
    normalized.includes("كمان اسبوع") ||
    normalized.includes("كمان أسبوع") ||
    normalized.includes("عقب اسبوع") ||
    normalized.includes("عقب أسبوع") ||
    lower.includes("after a week") ||
    lower.includes("in a week") ||
    lower.includes("after 1 week") ||
    lower.includes("in 1 week")
  ) return date.plus({ weeks: 1 });

  // Two months
  if (
    normalized.includes("بعد شهرين") ||
    normalized.includes("كمان شهرين") ||
    normalized.includes("عقب شهرين") ||
    lower.includes("after two months") ||
    lower.includes("in two months")
  ) return date.plus({ months: 2 });

  // One month
  if (
    normalized.includes("بعد شهر") ||
    normalized.includes("كمان شهر") ||
    normalized.includes("عقب شهر") ||
    lower.includes("after a month") ||
    lower.includes("in a month") ||
    lower.includes("after 1 month") ||
    lower.includes("in 1 month")
  ) return date.plus({ months: 1 });

  // Two days
  if (
    normalized.includes("بعد يومين") ||
    normalized.includes("كمان يومين") ||
    normalized.includes("عقب يومين") ||
    normalized.includes("ورا يومين") ||
    normalized.includes("قدام يومين") ||
    lower.includes("after two days") ||
    lower.includes("in two days")
  ) return date.plus({ days: 2 });

  // One day
  if (
    normalized.includes("بعد يوم") ||
    normalized.includes("كمان يوم") ||
    normalized.includes("عقب يوم") ||
    lower.includes("after a day") ||
    lower.includes("in a day") ||
    lower.includes("after 1 day") ||
    lower.includes("in 1 day")
  ) return date.plus({ days: 1 });

  // Digits with days (e.g. "كمان 3 ايام", "كمان ٣ ايام", "كمان 3", "بعد 3 ايام", "عقب 3 ايام", "خلال 3 ايام", "في خلال 3 ايام", "3 ايام", "in 3 days", "3 more days")
  const daysMatch = arabicNumText.match(
    /(?:(?:بعد|خلال|في\s*خلال|في\s*غضون|كمان|عقب|ورا|قدام|in|after)\s*(\d+)\s*(?:ايام|أيام|يوم|days?)?|(\d+)\s*(?:ايام|أيام|يوم|days?))/i
  );
  if (daysMatch) {
    const numDays = Number(daysMatch[1] || daysMatch[2]);
    if (!isNaN(numDays) && numDays > 0) {
      return date.plus({ days: numDays });
    }
  }

  // Digits with weeks
  const weeksMatch = arabicNumText.match(
    /(?:(?:بعد|خلال|في\s*خلال|في\s*غضون|كمان|عقب|ورا|قدام|in|after)\s*(\d+)\s*(?:اسابيع|أسابيع|اسبوع|أسبوع|weeks?)?|(\d+)\s*(?:اسابيع|أسابيع|اسبوع|أسبوع|weeks?))/i
  );
  if (weeksMatch) {
    const numWeeks = Number(weeksMatch[1] || weeksMatch[2]);
    if (!isNaN(numWeeks) && numWeeks > 0) {
      return date.plus({ weeks: numWeeks });
    }
  }

  // Digits with months
  const monthsMatch = arabicNumText.match(
    /(?:(?:بعد|خلال|في\s*خلال|في\s*غضون|كمان|عقب|ورا|قدام|in|after)\s*(\d+)\s*(?:اشهر|أشهر|شهور|شهر|months?)?|(\d+)\s*(?:اشهر|أشهر|شهور|شهر|months?))/i
  );
  if (monthsMatch) {
    const numMonths = Number(monthsMatch[1] || monthsMatch[2]);
    if (!isNaN(numMonths) && numMonths > 0) {
      return date.plus({ months: numMonths });
    }
  }

  // Word-based numbers for days
  const wordDays: [string, number][] = [
    ["ثلاثه", 3], ["ثلاثة", 3], ["تلاته", 3], ["تلاتة", 3], ["تلات", 3], ["ثلاث", 3], ["three", 3],
    ["اربعه", 4], ["أربعة", 4], ["اربع", 4], ["أربع", 4], ["four", 4],
    ["خمسه", 5], ["خمسة", 5], ["خمس", 5], ["five", 5],
    ["سته", 6], ["ستة", 6], ["ست", 6], ["six", 6],
    ["سبعه", 7], ["سبعة", 7], ["سبع", 7], ["seven", 7],
    ["ثمانيه", 8], ["ثمانية", 8], ["تمانية", 8], ["تمان", 8], ["ثمان", 8], ["eight", 8],
    ["تسعه", 9], ["تسعة", 9], ["تسع", 9], ["nine", 9],
    ["عشره", 10], ["عشرة", 10], ["عشر", 10], ["ten", 10]
  ];
  for (const [w, n] of wordDays) {
    const nw = normalizeArabic(w);
    if (
      normalized.includes(`بعد ${nw}`) ||
      normalized.includes(`كمان ${nw}`) ||
      normalized.includes(`عقب ${nw}`) ||
      normalized.includes(`خلال ${nw}`) ||
      normalized.includes(`ورا ${nw}`) ||
      normalized.includes(`قدام ${nw}`) ||
      normalized.includes(`${nw} ايام`) ||
      normalized.includes(`${nw} أيام`) ||
      normalized.includes(`${nw} يوم`) ||
      lower.includes(`after ${w} days`) ||
      lower.includes(`in ${w} days`) ||
      lower.includes(`${w} more days`)
    ) {
      return date.plus({ days: n });
    }
  }

  // Day after tomorrow
  if (
    normalized.includes("بعد بكره") ||
    normalized.includes("بعد بكرة") ||
    normalized.includes("بعد باكر") ||
    normalized.includes("بعد باجر") ||
    normalized.includes("عقب باكر") ||
    normalized.includes("عقب باجر") ||
    normalized.includes("عقب بكره") ||
    normalized.includes("عقب بكرة") ||
    normalized.includes("بعد غد") ||
    lower.includes("day after tomorrow") ||
    lower.includes("after tomorrow")
  ) return date.plus({ days: 2 });

  // Tomorrow
  if (
    normalized.includes("بكره") ||
    normalized.includes("بكرة") ||
    normalized.includes("باكر") ||
    normalized.includes("باجر") ||
    normalized.includes("غدا") ||
    normalized === "غد" ||
    lower.includes("tomorrow")
  ) return date.plus({ days: 1 });

  // Today
  if (
    normalized.includes("اليوم") ||
    normalized.includes("النهارده") ||
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
