import { describe, expect, it } from "vitest";
import { getOrderDateParts, parseOrderDate } from "../utils/orderDate.js";
import { analyzeOrders } from "../services/analytics/index.js";
import { analyticsOrders } from "./fixtures/orders.js";

describe("Athens order dates", () => {
  it("uses Athens wall time independent of the server timezone", () => {
    expect(parseOrderDate("2026-01-01 00:30:00")?.toISOString()).toBe("2025-12-31T22:30:00.000Z");
    expect(parseOrderDate("2026-07-01 00:30:00")?.toISOString()).toBe("2026-06-30T21:30:00.000Z");
    expect(parseOrderDate("2026-07-01T00:30:00.123")?.getUTCMilliseconds()).toBe(123);
  });
  it("buckets explicit UTC timestamps by Athens year, day and hour", () => {
    const stats = analyzeOrders([{ ...analyticsOrders[0], submission_date: "2025-12-31T22:30:00Z" }]);
    expect(stats.perYear[0].year).toBe("2026");
    expect(stats.all.weekdays).toEqual({ "Πέμπτη": 1 });
    expect(stats.all.months).toEqual({ "Ιανουάριος": 1 });
    expect(stats.all.phases.night).toBe(1);
  });
  it("rejects impossible dates and nonexistent daylight-saving wall times", () => {
    for (const value of ["2026-02-30 10:00:00", "2026-03-29 03:30:00", "2026-01-01 24:00:00", "bad", null]) {
      expect(parseOrderDate(value)).toBeNull();
    }
    const before = parseOrderDate("2026-03-29T00:30:00Z")!;
    const after = parseOrderDate("2026-03-29T01:30:00Z")!;
    expect(getOrderDateParts(before).hour).toBe(2);
    expect(getOrderDateParts(after).hour).toBe(4);
  });
  it("accepts explicit offsets for both occurrences of an autumn hour", () => {
    expect(parseOrderDate("2026-10-25T03:30:00+03:00")?.toISOString()).toBe("2026-10-25T00:30:00.000Z");
    expect(parseOrderDate("2026-10-25T03:30:00+02:00")?.toISOString()).toBe("2026-10-25T01:30:00.000Z");
    expect(parseOrderDate("2026-10-25 03:30:00")?.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  });
});
