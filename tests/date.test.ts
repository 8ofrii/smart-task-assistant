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
});
