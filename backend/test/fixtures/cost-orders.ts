import type { EfoodOrder } from "../../types.js";

export function costOrder(overrides: Partial<EfoodOrder> = {}): EfoodOrder {
  return {
    id: "cost-order", submission_date: "2026-10-10 12:00:00", price: 10,
    restaurant: { id: "cost-store", name: "Δοκιμαστικό κατάστημα" },
    products: [{ item_code: "item", name: "Δοκιμαστικό προϊόν", quantity: 1, unit_price: 10 }],
    coupon: null, joker_discount: 0, delivery_cost: 0, tip: 0, service_fee: 0,
    service_fees: { total: 0, current: 0, late_night: 0 }, bags: { amount: 0 }, csr: {},
    priority_fee: 0, small_order_fee: 0, pvc_recycling_taxes: 0, additional_taxes: 0,
    ...overrides,
  };
}

// Synthetic browser fixture: complete, unexplained, older-year, and incomplete orders.
export const costOrders = [
  costOrder({ id: "complete", price: 12.6, delivery_cost: 2, tip: 1, coupon: { amount: 2 },
    service_fee: 0.5, service_fees: { total: 0.5 }, bags: { amount: 0.1 }, csr: { amount: 1 } }),
  costOrder({ id: "unexplained", price: 9 }),
  costOrder({ id: "previous-year", submission_date: "2025-12-31 12:00:00", price: 21,
    products: [{ item_code: "other", quantity: 1, unit_price: 20 }],
    service_fee: 1, service_fees: { total: 1 } }),
  costOrder({ id: "incomplete", bags: undefined }),
];
