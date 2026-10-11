import { describe, expect, it } from "vitest";
import {
  buildFilteredView,
  EMPTY_ORDER_FILTERS,
  getHistoryDay,
  getOrderCostBreakdown,
  validateOrderFilters,
  paymentLabel,
} from "./ordersAnalytics";
import { testOrders } from "../test/fixtures";

describe("shared filtered analytics", () => {
  it("labels observed payment methods and safely retains any unknown code", () => {
    expect(paymentLabel("applepay")).toBe("Apple Pay");
    expect(paymentLabel("googlepay")).toBe("Google Pay");
    for (const code of ["new_method", "constructor", "toString", "__proto__"])
      expect(paymentLabel(code)).toBe(code);
  });
  it("filters one common set for cards, charts, map, favourites and cost analysis", () => {
    const view = buildFilteredView(testOrders, "all", {
      ...EMPTY_ORDER_FILTERS,
      search: "GYRO",
      payment: "cash",
      min: "12,50",
      max: "12.50",
    });
    expect(view.history.map((order) => order.price)).toEqual([12.5]);
    expect(view.all).toMatchObject({
      totalOrders: 1,
      totalPrice: 12.5,
      couponAmount: 1,
      deliveryCost: 2,
      totalTips: 0.5,
      uniqueRestaurants: 1,
      paymentMethods: { cash: 1 },
      mostOrderedProduct: { name: "Pita", quantity: 2 },
    });
    expect(view.all.restaurants).toHaveLength(1);
    expect(view.all.costBreakdown.components.delivery.amount).toBe(2);
    expect(
      view.timeline.months.reduce((sum, bucket) => sum + bucket.totalOrders, 0),
    ).toBe(1);
    expect(
      view.timeline.months.reduce(
        (sum, bucket) => sum + Math.round(bucket.totalPrice * 100),
        0,
      ),
    ).toBe(1250);
    expect(testOrders.history).toHaveLength(4);
  });

  it("matches Greek search without accents and combines year/date/store filters inclusively", () => {
    const orders = {
      ...testOrders,
      history: testOrders.history.map((entry) => ({
        ...entry,
        restaurant: {
          ...entry.restaurant,
          name: entry.restaurant.id === 1 ? "Καφές" : entry.restaurant.name,
        },
      })),
    };
    const view = buildFilteredView(orders, "2025", {
      ...EMPTY_ORDER_FILTERS,
      search: "ΚΑΦΕΣ",
      restaurant: "1",
      from: "2025-03-10",
      through: "2025-03-10",
    });
    expect(view.history).toHaveLength(1);
    expect(view.all.totalPrice).toBe(12.5);
    expect(view.scope).toEqual({ from: "2025-03-10", through: "2025-03-10" });
    expect(
      getHistoryDay({
        ...testOrders.history[0],
        submissionDate: "2025-03-09T22:30:00Z",
      }),
    ).toBe("2025-03-10");
  });

  it("keeps undated orders in all-time totals and identifies exclusion by dates/year", () => {
    expect(
      buildFilteredView(testOrders, "all", EMPTY_ORDER_FILTERS).all.totalPrice,
    ).toBe(49.74);
    const view = buildFilteredView(testOrders, "2025", EMPTY_ORDER_FILTERS);
    expect(view.all.totalPrice).toBe(32.75);
    expect(view.history).toHaveLength(2);
    expect(view.excludedUndated).toBe(1);
    expect(
      buildFilteredView(testOrders, "all", {
        ...EMPTY_ORDER_FILTERS,
        from: "2025-01-01",
      }).excludedUndated,
    ).toBe(1);
  });

  it("uses the original sync and observed coverage even when a cohort is empty", () => {
    const view = buildFilteredView(testOrders, "all", {
      ...EMPTY_ORDER_FILTERS,
      search: "nonexistent",
    });
    expect(view.all).toMatchObject({
      totalOrders: 0,
      totalPrice: 0,
      restaurants: [],
      mostOrderedProduct: null,
    });
    expect(view.timeline.asOf).toBe(testOrders.timeline.asOf);
    expect(view.timeline.coverage.from).toBe(testOrders.timeline.coverage.from);
    expect(
      view.timeline.months.every((bucket) => bucket.totalPrice === 0),
    ).toBe(true);
    expect(
      view.timeline.comparisons.find((value) => value.key === "days30")?.change
        ?.totalPrice,
    ).toEqual({ absolute: 0, percent: null });
    expect(
      buildFilteredView(testOrders, "2025", {
        ...EMPTY_ORDER_FILTERS,
        search: "nonexistent",
      }).timeline.comparisons.some((value) => value.key === "year:2025"),
    ).toBe(true);
  });

  it("compares the same non-date cohort in an equal previous window", () => {
    const view = buildFilteredView(testOrders, "all", {
      ...EMPTY_ORDER_FILTERS,
      restaurant: "1",
      from: "2025-04-01",
      through: "2025-04-30",
    });
    expect(view.all.totalPrice).toBe(20.25);
    const comparison = view.timeline.comparisons.find(
      (value) => value.key === "custom",
    )!;
    expect(comparison.days).toBe(30);
    expect(comparison.current).toMatchObject({
      from: "2025-04-01",
      through: "2025-04-30",
      totalPrice: 20.25,
      complete: true,
    });
    expect(comparison.previous).toMatchObject({
      from: "2025-03-02",
      through: "2025-03-31",
      totalPrice: 12.5,
      complete: true,
    });
    expect(comparison.change?.totalPrice.absolute).toBe(7.75);
    expect(
      view.timeline.months.find((bucket) => bucket.key === "2025-03")
        ?.totalPrice,
    ).toBe(0);
  });

  it("preserves per-order cost coverage and coupon adjustment signs", () => {
    const entry = {
      ...testOrders.history[1],
      products: [
        ...testOrders.history[1].products,
        {
          ...testOrders.history[1].products[0],
          name: "Discount",
          quantity: 1,
          unitPrice: -1,
          isCoupon: true,
        },
      ],
    };
    const costs = getOrderCostBreakdown(entry);
    expect(costs.components.productLines.amount).toBe(9);
    expect(costs.components.coupon.amount).toBe(0); // Already present in the signed product line.
    expect(costs.components.service.amount).toBeNull();
    expect(costs.reconciliation.unavailableOrders).toBe(1);
  });

  it("rejects malformed dates and invalid amount ranges, including unsafe numbers", () => {
    for (const filters of [
      { from: "2025-02-30" },
      { from: "2025-05-01", through: "2025-04-01" },
      { min: "-1" },
      { min: "1.234" },
      { min: "Infinity" },
      { min: "9007199254740991" },
      { min: "10", max: "9" },
    ]) {
      expect(
        validateOrderFilters({ ...EMPTY_ORDER_FILTERS, ...filters }),
      ).not.toBeNull();
    }
    expect(
      validateOrderFilters({ ...EMPTY_ORDER_FILTERS, min: "0", max: "0,00" }),
    ).toBeNull();
  });
});
