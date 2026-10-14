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
});
