import { describe, expect, it } from "vitest";
import { makeTestTimeline } from "../test/fixtures";
import type { OrderTimeline, PeriodComparison } from "../types";
import { isOrderTimeline } from "./timelineValidation";

function completeTimeline(): OrderTimeline {
  const timeline = makeTestTimeline(3, 42.74);
  const zero = {
    totalOrders: 0,
    totalPrice: 0,
    averagePrice: null,
    medianPrice: null,
    complete: true,
  };
  const comparison: PeriodComparison = {
    key: "days30",
    days: 30,
    current: { ...zero, from: "2025-12-02", through: "2025-12-31" },
    previous: { ...zero, from: "2025-11-02", through: "2025-12-01" },
    change: {
      totalPrice: { absolute: 0, percent: null },
      totalOrders: { absolute: 0, percent: null },
      averagePrice: null,
      medianPrice: null,
    },
  };
  timeline.comparisons = timeline.comparisons.map((c) =>
    c.key === "days30" ? comparison : c,
  );
  return timeline;
}

describe("timeline contract", () => {
  it("accepts complete comparisons with an unavailable percentage against zero", () => {
    expect(isOrderTimeline(completeTimeline(), 3, 42.74)).toBe(true);
  });

  it("rejects fabricated percentage changes, duplicate periods and incomplete comparison deltas", () => {
    for (const change of [
      {
        totalPrice: { absolute: 0, percent: 100 },
        totalOrders: { absolute: 0, percent: null },
        averagePrice: null,
        medianPrice: null,
      },
      null,
    ]) {
      const timeline = completeTimeline();
      timeline.comparisons.find((c) => c.key === "days30")!.change = change;
      expect(isOrderTimeline(timeline, 3, 42.74)).toBe(false);
    }
    const duplicate = completeTimeline();
    duplicate.comparisons.push(duplicate.comparisons[0]);
    expect(isOrderTimeline(duplicate, 3, 42.74)).toBe(false);
    const incomplete = completeTimeline();
    incomplete.comparisons.find((c) => c.key === "days30")!.previous.complete =
      false;
    expect(isOrderTimeline(incomplete, 3, 42.74)).toBe(false);
  });

  it("rejects missing zero periods at the end of coverage and a mismatched sync date", () => {
    const timeline = completeTimeline();
    expect(
      isOrderTimeline(
        { ...timeline, months: timeline.months.slice(0, -1) },
        3,
        42.74,
      ),
    ).toBe(false);
    expect(
      isOrderTimeline(
        { ...timeline, asOf: "2026-01-02T08:30:00.000Z" },
        3,
        42.74,
      ),
    ).toBe(false);
  });
});
