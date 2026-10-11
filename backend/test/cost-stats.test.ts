import { describe, expect, it } from "vitest";
import { analyzeOrders } from "../services/analytics/index.js";
import { normalizeOrder } from "../services/orderValidation.js";
import { costOrder, costOrders } from "./fixtures/cost-orders.js";

const costs = (orders = [costOrder()]) => analyzeOrders(orders).all.costBreakdown;

describe("cost analysis", () => {
  it("reconstructs signed product lines, charges, and separate discounts once", () => {
    const stats = analyzeOrders([costOrder({ price: 13.45, delivery_cost: 2, service_fee: 0.5,
      service_fees: { total: 0.5, current: 0.3, late_night: 0.2 }, tip: 1, bags: { amount: 0.1 },
      priority_fee: 0.5, small_order_fee: 0.5, pvc_recycling_taxes: 0.1, csr: { amount: 1 },
      coupon: { amount: 2 }, joker_discount: 0.25, additional_taxes: 0.1,
      subscription_pro_discount: 5, products: [
        { item_code: "item", quantity: 2, unit_price: 6 },
        { item_code: "discount", quantity: 1, unit_price: -2, is_offer: true, offer_discount: true },
      ],
    })]).all;
    expect(stats.totalPrice).toBe(13.45);
    expect(stats.costBreakdown.components.service.amount).toBe(0.5);
    expect(stats.costBreakdown.components.productLines.amount).toBe(10);
    expect(stats.costBreakdown.additionalCharges.amount).toBe(5.7);
    expect(stats.costBreakdown.includedTaxes.amount).toBe(0.1);
    expect(stats.costBreakdown.reconciliation).toMatchObject({ matchedOrders: 1, absoluteDifference: 0 });
  });

  it("does not count a coupon twice when explicit product adjustment proves overlap", () => {
    const result = costs([costOrder({ price: 8, coupon: { amount: 2 }, products: [
      { item_code: "item", quantity: 1, unit_price: 10 },
      { item_code: "coupon", quantity: 1, unit_price: -2, is_coupon: true },
    ] })]);
    expect(result.components.productLines.amount).toBe(8);
    expect(result.components.coupon.amount).toBe(0);
    expect(result.reconciliation.matchedOrders).toBe(1);
  });

  it("keeps ambiguous coupon or delivery adjustments unavailable rather than guessing", () => {
    const coupon = costOrder({ coupon: { amount: 3 }, products: [
      { item_code: "coupon", quantity: 1, unit_price: -2, is_coupon: true },
    ] });
    const delivery = costOrder({ products: [
      { item_code: "delivery-discount", quantity: 1, unit_price: -1, is_delivery_fee_discount: true },
    ] });
    const result = costs([coupon, delivery]);
    expect(result.components.coupon).toMatchObject({ amount: null, coveredOrders: 1 });
    expect(result.reconciliation.unavailableOrders).toBe(2);
  });

  it("supports either service fee alias, but marks conflicting aliases unknown", () => {
    expect(costs([costOrder({ price: 11, service_fee: undefined, service_fees: { total: 1 } })])
      .components.service.amount).toBe(1);
    expect(costs([costOrder({ price: 11, service_fee: 1, service_fees: undefined })])
      .reconciliation.matchedOrders).toBe(1);
    expect(costs([costOrder({ service_fee: 1, service_fees: { total: 2 } })])
      .components.service).toEqual({ amount: null, knownAmount: 0, coveredOrders: 0 });
  });

  it("distinguishes complete zero, partial known amounts, and absent values", () => {
    const result = costs([costOrder({ price: 11, service_fee: 1, service_fees: undefined }),
      costOrder({ service_fee: undefined, service_fees: undefined })]);
    expect(result.components.service).toEqual({ amount: null, knownAmount: 1, coveredOrders: 1 });
    expect(result.additionalCharges).toEqual({ amount: null, knownAmount: 1, coveredOrders: 1 });
    expect(result.components.bags).toEqual({ amount: 0, knownAmount: 0, coveredOrders: 2 });
    expect(result.reconciliation).toMatchObject({ matchedOrders: 1, unavailableOrders: 1 });
  });

  it("shows both offsetting mismatches even when their net difference is zero", () => {
    const result = costs([costOrder({ price: 9 }), costOrder({ price: 11 })]);
    expect(result.reconciliation).toEqual({ matchedOrders: 0, mismatchedOrders: 2, unavailableOrders: 0,
      netDifference: 0, absoluteDifference: 2 });
  });

  it("allows one-cent rounding discrepancies while retaining the difference", () => {
    expect(costs([costOrder({ price: 10.01 })]).reconciliation).toMatchObject({ matchedOrders: 1,
      mismatchedOrders: 0, netDifference: 0.01, absoluteDifference: 0.01 });
  });

  it("rounds fractional quantities per line and sums cents without drift", () => {
    const result = costs(Array.from({ length: 10 }, () => costOrder({ price: 0.1,
      products: [{ item_code: "weighted", quantity: 0.25, unit_price: 0.4 }] })));
    expect(result.components.productLines.amount).toBe(1);
    expect(result.reconciliation.matchedOrders).toBe(10);
  });

  it("normalizes only valid fee values, retaining explicit empty donation as zero", () => {
    const normalized = normalizeOrder({ ...costOrder(), bags: { amount: "1" }, priority_fee: -1,
      small_order_fee: Infinity, csr: { title: "Donation without amount" }, service_fees: [] });
    expect(normalized.bags?.amount).toBeNull();
    expect(normalized.priority_fee).toBeNull();
    expect(normalized.small_order_fee).toBeNull();
    expect(normalized.csr?.amount).toBeNull();
    expect(costs().components.donation.amount).toBe(0);
  });

  it("uses exactly the orders of each year and preserves reported totals", () => {
    const stats = analyzeOrders(costOrders);
    expect(stats.all.totalPrice).toBe(52.6);
    expect(stats.all.costBreakdown.reconciliation).toMatchObject({ matchedOrders: 2, mismatchedOrders: 1, unavailableOrders: 1 });
    expect(stats.perYear.find((year) => year.year === "2025")?.costBreakdown.components.service.amount).toBe(1);
    expect(stats.perYear.find((year) => year.year === "2026")?.costBreakdown.components.service.amount).toBe(0.5);
  });

  it("returns zero complete totals and no reconciliation claims for empty history", () => {
    const result = costs([]);
    expect(result.additionalCharges).toEqual({ amount: 0, knownAmount: 0, coveredOrders: 0 });
    expect(result.components.productLines.amount).toBe(0);
    expect(result.reconciliation).toEqual({ matchedOrders: 0, mismatchedOrders: 0, unavailableOrders: 0,
      netDifference: 0, absoluteDifference: 0 });
  });
});
