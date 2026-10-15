import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { APP_TIMEZONE, parseTime, resolveDueDate } from "../src/services/date.service.js";

describe("Arabic date resolution", () => {
  const now = DateTime.fromISO("2026-10-13T10:00:00", { zone: APP_TIMEZONE });

  it("resolves بكرة", () => {
    expect(resolveDueDate("بكرة", "الساعة 10", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-14 10:00");
  });

  it("resolves بكره", () => {
    expect(resolveDueDate("بكره", "الساعة 10", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-14 10:00");
  });

  it("resolves بعد بكرة", () => {
    expect(resolveDueDate("بعد بكرة", "1 الظهر", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-15 13:00");
  });

  it("resolves Arabic digits", () => {
    expect(parseTime("الساعة ١٠:٣٠")).toEqual({ hour: 10, minute: 30 });
  });

  it("resolves Persian digits", () => {
    expect(parseTime("الساعة ۱۰:۳۰")).toEqual({ hour: 10, minute: 30 });
  });

  it("moves Friday to Saturday", () => {
    const result = resolveDueDate("الجمعة", "الساعة 9", now);
    expect(result.movedFromFriday).toBe(true);
    expect(result.dueAt.weekday).toBe(6);
    expect(result.dueAt.hour).toBe(9);
  });

  it("resolves English relative dates and times", () => {
    expect(resolveDueDate("tomorrow", "10 AM", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-14 10:00");

    expect(resolveDueDate("day after tomorrow", "1 PM", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-15 13:00");

    const fridayResult = resolveDueDate("Friday", "9 AM", now);
    expect(fridayResult.movedFromFriday).toBe(true);
    expect(fridayResult.dueAt.weekday).toBe(6);
    expect(fridayResult.dueAt.hour).toBe(9);
  });

  it("resolves Arabic word hours and times correctly", () => {
    // Exact user case: الساعة الرابعة مساءا -> 16:00
    expect(parseTime("الساعة الرابعة مساءا")).toEqual({ hour: 16, minute: 0 });
    expect(parseTime("الساعة الرابعة عصرا")).toEqual({ hour: 16, minute: 0 });
    expect(parseTime("الساعة 4 مساء")).toEqual({ hour: 16, minute: 0 });
    expect(parseTime("الساعة الرابعة والنصف مساءا")).toEqual({ hour: 16, minute: 30 });
    expect(parseTime("الساعة الخامسة والربع مساء")).toEqual({ hour: 17, minute: 15 });
    expect(parseTime("الساعة العاشرة صباحا")).toEqual({ hour: 10, minute: 0 });
    expect(parseTime("الحادية عشر صباحا")).toEqual({ hour: 11, minute: 0 });
    expect(parseTime("الساعة الثانية عشر ظهرا")).toEqual({ hour: 12, minute: 0 });
    expect(parseTime("الساعة الثانية عشر ليلا")).toEqual({ hour: 0, minute: 0 });
    expect(parseTime("خمسة الا ربع مساء")).toEqual({ hour: 16, minute: 45 });
  });

  it("resolves multi-day relative dates such as بعد 3 ايام", () => {
    // 2026-10-13 (Tuesday) + 2 days -> 2026-10-15 (Thursday)
    expect(resolveDueDate("بعد 2 يوم", "الساعة 10", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-15 10:00");

    // 2026-10-13 (Tuesday) + 3 days -> 2026-10-16 is Friday -> rolled to Saturday 2026-10-17!
    const res3Days = resolveDueDate("بعد 3 ايام", "العصر", now);
    expect(res3Days.movedFromFriday).toBe(true);
    expect(res3Days.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-17 15:00");

    // 2026-10-13 (Tuesday) + 4 days -> 2026-10-17 (Saturday)
    expect(resolveDueDate("بعد 4 أيام", "الساعة 4 العصر", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-17 16:00");

    // In 5 days
    expect(resolveDueDate("in 5 days", "10 AM", now).dueAt.toFormat("yyyy-LL-dd HH:mm"))
      .toBe("2026-10-18 10:00");
  });

  it("resolves dialect relative dates such as كمان 3 ايام and عقب باكر", () => {
    // 1. Monday baseline: 2026-10-12 (Monday) + 3 days -> 2026-10-15 (Thursday) (no Friday shift)
    const monday = DateTime.fromISO("2026-10-12T10:00:00", { zone: APP_TIMEZONE });
    const mondayRes = resolveDueDate("كمان 3 ايام", "الساعة 10", monday);
    expect(mondayRes.movedFromFriday).toBe(false);
    expect(mondayRes.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");

    // 2. Arabic digits: كمان ٣ ايام
    const arDigitsRes = resolveDueDate("كمان ٣ ايام", "الساعة 10", monday);
    expect(arDigitsRes.movedFromFriday).toBe(false);
    expect(arDigitsRes.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");

    // 3. Tuesday baseline: 2026-10-13 (Tuesday) + 3 days -> Friday -> rolled to Saturday 2026-10-17!
    const resTuesday = resolveDueDate("كمان 3 ايام", "الساعة 10", now);
    expect(resTuesday.movedFromFriday).toBe(true);
    expect(resTuesday.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-17 10:00");

    // 4. كمان يومين: 2026-10-13 (Tuesday) + 2 days -> 2026-10-15 (Thursday)
    const res2Days = resolveDueDate("كمان يومين", "الساعة 10", now);
    expect(res2Days.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");

    // 5. كمان اسبوع: 2026-10-13 (Tuesday) + 1 week -> 2026-10-20 (Tuesday)
    const res1Week = resolveDueDate("كمان اسبوع", "الساعة 10", now);
    expect(res1Week.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-20 10:00");

    // 6. Gulf dialect: عقب باكر (day after tomorrow)
    const resAgabBakir = resolveDueDate("عقب باكر", "الساعة 10", now);
    expect(resAgabBakir.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");

    // 7. Gulf dialect: عقب 3 ايام
    const resAgab3 = resolveDueDate("عقب 3 ايام", "الساعة 10", monday);
    expect(resAgab3.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");

    // 8. خلال 3 أيام
    const resKhelal = resolveDueDate("خلال 3 أيام", "الساعة 10", monday);
    expect(resKhelal.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");

    // 9. 3 ايام (without preposition)
    const resDirect = resolveDueDate("3 ايام", "الساعة 10", monday);
    expect(resDirect.dueAt.toFormat("yyyy-LL-dd HH:mm")).toBe("2026-10-15 10:00");
  });
});
