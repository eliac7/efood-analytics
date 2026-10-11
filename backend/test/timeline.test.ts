import { describe, expect, it } from "vitest";
import { analyzeOrders } from "../services/analytics/index.js";
import { calculateTimeline } from "../services/analytics/orders/timeline.js";
import { costOrder } from "./fixtures/cost-orders.js";
import type { EfoodOrder } from "../types.js";

const order = (submission_date: string | null, price = 10): EfoodOrder =>
  costOrder({ submission_date, price });
const sync = new Date("2026-03-11T10:00:00Z");

describe("spending timeline", () => {
  it("keeps different years separate, fills gaps and reconciles unallocated money", () => {
    const result = analyzeOrders(
      [
        order("2025-01-01 12:00:00", 0.1),
        order("2026-01-01 12:00:00", 0.2),
        order(null, 7),
        order("2026-04-01 12:00:00", 9),
      ],
      sync,
    );
    expect(
      result.timeline.months.find((b) => b.key === "2025-01")?.totalPrice,
    ).toBe(0.1);
    expect(
      result.timeline.months.find((b) => b.key === "2026-01")?.totalPrice,
    ).toBe(0.2);
    expect(
      result.timeline.months.find((b) => b.key === "2025-02"),
    ).toMatchObject({
      totalPrice: 0,
      totalOrders: 0,
      averagePrice: null,
      medianPrice: null,
    });
    expect(result.timeline.coverage).toMatchObject({
      undatedOrders: 1,
      undatedAmount: 7,
      futureOrders: 1,
      futureAmount: 9,
    });
    for (const buckets of [result.timeline.months, result.timeline.weeks]) {
      expect(
        Math.round(buckets.reduce((sum, b) => sum + b.totalPrice, 16) * 100),
      ).toBe(Math.round(result.all.totalPrice * 100));
      expect(buckets.reduce((sum, b) => sum + b.totalOrders, 2)).toBe(4);
    }
    expect(result.timeline.comparisons.every((c) => c.change === null)).toBe(
      true,
    );
  });

  it("uses Athens dates and splits weeks at year boundaries", () => {
    const result = calculateTimeline(
      [order("2025-12-31T22:30:00Z", 5), order("2025-12-31T20:00:00Z", 7)],
      new Date("2026-01-03T12:00:00Z"),
    );
    expect(result.months.map((b) => [b.key, b.totalPrice])).toEqual([
      ["2025-12", 7],
      ["2026-01", 5],
    ]);
    expect(result.weeks.map((b) => [b.from, b.through, b.totalPrice])).toEqual([
      ["2025-12-29", "2025-12-31", 7],
      ["2026-01-01", "2026-01-04", 5],
    ]);
    expect(result.weeks.every((b) => b.partial)).toBe(true);
  });

  it("computes average and median from canonical order prices, including zero", () => {
    const result = calculateTimeline(
      [
        order("2026-03-01 12:00:00", 0),
        order("2026-03-02 12:00:00", 10),
        order("2026-03-03 12:00:00", 100),
      ],
      sync,
    );
    expect(result.months[0]).toMatchObject({
      totalPrice: 110,
      totalOrders: 3,
      averagePrice: 36.67,
      medianPrice: 10,
    });
    const even = calculateTimeline(
      [order("2026-03-01 12:00:00", 0.01), order("2026-03-02 12:00:00", 0.02)],
      sync,
    );
    expect(even.months[0]).toMatchObject({
      totalPrice: 0.03,
      averagePrice: 0.02,
      medianPrice: 0.02,
    });
  });

  it("compares completed days of a month and caps both sides to the shorter month", () => {
    const orders = [
      order("2026-01-01 12:00:00", 0),
      order("2026-02-10 12:00:00", 5),
      order("2026-02-11 12:00:00", 100),
      order("2026-03-10 12:00:00", 15),
      order("2026-03-11 09:00:00", 100),
    ];
    const comparison = calculateTimeline(orders, sync).comparisons.find(
      (c) => c.key === "month",
    )!;
    expect(comparison).toMatchObject({
      days: 10,
      current: { from: "2026-03-01", through: "2026-03-10", totalPrice: 15 },
      previous: { from: "2026-02-01", through: "2026-02-10", totalPrice: 5 },
      change: { totalPrice: { absolute: 10, percent: 200 } },
    });
    const capped = calculateTimeline(orders, new Date("2026-03-31T12:00:00Z"))
      .comparisons[0];
    expect(capped.days).toBe(28);
    expect(capped.current.through).toBe("2026-03-28");
    expect(capped.previous.through).toBe("2026-02-28");
  });

  it("anchors comparisons to sync even when the last order is old", () => {
    const timeline = calculateTimeline(
      [order("2025-01-01 12:00:00"), order("2025-04-01 12:00:00")],
      sync,
    );
    expect(timeline.months.at(-1)).toMatchObject({
      key: "2026-03",
      totalOrders: 0,
      totalPrice: 0,
      partial: true,
    });
    expect(timeline.comparisons[0]).toMatchObject({
      current: { totalPrice: 0, complete: true },
      previous: { totalPrice: 0, complete: true },
      change: {
        totalPrice: { absolute: 0, percent: null },
        averagePrice: null,
      },
    });
  });

  it("keeps rolling 30 and 90 calendar-day windows equal across DST", () => {
    const timeline = calculateTimeline(
      [
        order("2025-01-01 12:00:00", 0),
        order("2026-03-29 02:30:00", 4),
        order("2026-03-29 04:30:00", 6),
      ],
      new Date("2026-03-31T09:00:00Z"),
    );
    for (const days of [30, 90]) {
      const c = timeline.comparisons.find((c) => c.key === `days${days}`)!;
      expect(c.days).toBe(days);
      expect(
        (Date.parse(c.current.through) - Date.parse(c.current.from)) /
          86400000 +
          1,
      ).toBe(days);
      expect(c.previous.through).toBe(
        new Date(Date.parse(c.current.from) - 86400000)
          .toISOString()
          .slice(0, 10),
      );
      expect(c.change?.totalPrice).toEqual({ absolute: 10, percent: null });
    }
  });

  it("uses the same elapsed day count for yearly comparisons, including leap years", () => {
    const result = calculateTimeline(
      [
        order("2023-01-01 12:00:00", 0),
        order("2024-02-29 12:00:00", 10),
        order("2024-12-31 12:00:00", 7),
      ],
      new Date("2024-03-01T12:00:00Z"),
    );
    const current = result.comparisons.find((c) => c.key === "year:2024")!;
    expect(current).toMatchObject({
      days: 60,
      current: { through: "2024-02-29", totalPrice: 10 },
      previous: { through: "2023-03-01" },
    });
    const historical = calculateTimeline(
      [order("2023-01-01 12:00:00", 0), order("2024-12-31 12:00:00", 7)],
      sync,
    ).comparisons.find((c) => c.key === "year:2024")!;
    expect(historical).toMatchObject({
      days: 365,
      current: { through: "2024-12-30", totalPrice: 0 },
      previous: { through: "2023-12-31" },
    });
  });

  it("does not infer zero history before the first known order or compare the first day", () => {
    const timeline = calculateTimeline([order("2026-03-03 12:00:00")], sync);
    expect(timeline.months).toHaveLength(1);
    expect(timeline.months[0].partial).toBe(true);
    expect(timeline.comparisons.every((c) => c.change === null)).toBe(true);
    const firstDay = calculateTimeline(
      [order("2026-01-01 09:00:00")],
      new Date("2026-01-01T12:00:00Z"),
    );
    expect(firstDay.comparisons[0]).toMatchObject({ days: 0, change: null });
    expect(
      firstDay.comparisons.find((c) => c.key === "year:2026"),
    ).toMatchObject({ days: 0, change: null });
  });

  it("supports empty and entirely undated history without invented buckets", () => {
    expect(calculateTimeline([], sync)).toMatchObject({
      coverage: { from: null, undatedOrders: 0 },
      months: [],
      weeks: [],
    });
    expect(calculateTimeline([order("bad", 7)], sync)).toMatchObject({
      coverage: { from: null, undatedOrders: 1, undatedAmount: 7 },
      months: [],
      weeks: [],
    });
    expect(() => calculateTimeline([], new Date("bad"))).toThrow(
      "Invalid analytics reference date",
    );
  });
});
