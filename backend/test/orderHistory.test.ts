import { describe, expect, it } from "vitest";
import { analyzeOrders } from "../services/analytics/index.js";
import { analyticsOrders } from "./fixtures/orders.js";
import { normalizeOrders } from "../services/orderValidation.js";
import { toOrderHistory } from "../services/orderHistory.js";

describe("safe order history", () => {
  it("projects a complete history while keeping customer fields out of the response", () => {
    const privateOrder = {
      ...analyticsOrders[0],
      id: "private-order-id",
      comment: "PRIVATE_COMMENT",
      customer: { name: "PRIVATE_CUSTOMER" },
      delivery_address: {
        city: "Athens",
        address: "PRIVATE_ADDRESS",
        latitude: 99,
        longitude: 99,
      },
      restaurant: {
        ...analyticsOrders[0].restaurant,
        private_field: "PRIVATE_STORE_FIELD",
      },
      products: [
        {
          ...analyticsOrders[0].products[0],
          tracking_product_id: "PRIVATE_TRACKING",
          customisation: "PRIVATE_CUSTOMISATION",
          addons: ["PRIVATE_ADDON"],
        },
      ],
    };
    const result = analyzeOrders(
      [privateOrder],
      new Date("2026-01-01T08:30:00Z"),
    );
    expect(result.history).toHaveLength(1);
    expect(result.history[0]).toMatchObject({
      id: "order:0",
      price: 12.5,
      city: "Athens",
      restaurant: { name: "Gyro House" },
    });
    expect(JSON.stringify(result.history)).not.toMatch(
      /PRIVATE_|private-order-id|latitude":99|longitude":99/,
    );
    expect(result.history[0].products[0].identity).toMatch(/^[a-f0-9]{64}$/);
  });

  it("retains product grouping without exposing its original identity or customisation", () => {
    const raw = analyticsOrders[0];
    const product = { ...raw.products[0], customisation: "extra sauce" };
    const [a, b, c, d] = toOrderHistory(
      normalizeOrders([
        { ...raw, products: [product] },
        { ...raw, products: [{ ...product, quantity: 9 }] },
        { ...raw, products: [{ ...product, customisation: "no sauce" }] },
        {
          ...raw,
          restaurant: { ...raw.restaurant, id: 99 },
          products: [product],
        },
      ]),
    );
    expect(a.products[0].identity).toBe(b.products[0].identity);
    expect(a.products[0].identity).not.toBe(c.products[0].identity);
    expect(a.products[0].identity).not.toBe(d.products[0].identity);
    expect(JSON.stringify(a)).not.toContain("extra sauce");
  });

  it("preserves signed adjustments, aliases and unknown amounts for shared cost calculations", () => {
    const result = analyzeOrders([
      {
        ...analyticsOrders[0],
        coupon: null,
        tip: undefined,
        service_fee: 0.3,
        service_fees: { total: 0.3 },
        csr: {},
        products: [
          {
            item_code: "discount",
            name: "Discount",
            quantity: 1,
            unit_price: -2,
            is_coupon: true,
          },
        ],
      },
    ]);
    expect(result.history[0].amounts).toMatchObject({
      coupon: 0,
      tips: null,
      donation: 0,
      service: 0.3,
      serviceAlias: 0.3,
      priority: null,
    });
    expect(result.history[0].products[0]).toMatchObject({
      unitPrice: -2,
      isCoupon: true,
    });
  });

  it("keeps undated orders and observed status without implying fulfilment", () => {
    const result = analyzeOrders(
      analyticsOrders.map((order) => ({ ...order, status: "accepted" })),
    );
    expect(result.history.map((order) => order.price)).toEqual([
      20.25, 12.5, 9.99, 7,
    ]);
    expect(result.history.at(-1)?.submissionDate).toBeNull();
    expect(result.history.every((order) => order.status === "accepted")).toBe(
      true,
    );
    expect(new Set(result.history.map((order) => order.id)).size).toBe(
      result.all.totalOrders,
    );
    expect(
      Math.round(
        result.history.reduce((sum, order) => sum + order.price, 0) * 100,
      ) / 100,
    ).toBe(result.all.totalPrice);
  });
});
