import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { fetchAllOrders, fetchOrdersPage, UPSTREAM_TIMEOUT_MS } from "../services/orderService.js";
import { normalizeOrders, parseOrdersPage } from "../services/orderValidation.js";
import { analyticsOrders } from "./fixtures/orders.js";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));
const get = vi.mocked(axios.get);
const page = (orders: unknown[], hasNext: boolean) => ({ data: { status: "ok", data: { orders, hasNext } } });

describe("order history boundary", () => {
  beforeEach(() => { get.mockReset(); });
  it("requests only real pages, deduplicates overlapping IDs and stops at hasNext=false", async () => {
    get.mockResolvedValueOnce(page(analyticsOrders.slice(0, 2), true))
      .mockResolvedValueOnce(page(analyticsOrders.slice(1, 3), false));
    const orders = await fetchAllOrders("test-session");
    expect(orders.map((o) => o.id)).toEqual(analyticsOrders.slice(0, 3).map((o) => o.id));
    expect(get).toHaveBeenCalledTimes(2);
    expect(new URL(get.mock.calls[1][0]).searchParams.get("offset")).toBe("2");
    expect(get.mock.calls[0][1]?.timeout).toBe(UPSTREAM_TIMEOUT_MS);
  });
  it("does not return successful partial history on a 404 or a rate limit", async () => {
    for (const status of [404, 429, 503]) {
      get.mockReset();
      get.mockResolvedValueOnce(page(analyticsOrders.slice(0, 1), true))
        .mockRejectedValueOnce({ response: { status } });
      await expect(fetchAllOrders("session")).rejects.toMatchObject({ response: { status } });
      expect(get).toHaveBeenCalledTimes(2);
    }
  });
  it("rejects non-advancing and empty pages rather than looping forever", async () => {
    get.mockResolvedValue(page(analyticsOrders.slice(0, 1), true));
    await expect(fetchAllOrders("session")).rejects.toMatchObject({ response: { status: 502 } });
    expect(get).toHaveBeenCalledTimes(2);
    expect(() => parseOrdersPage({ status: "ok", data: { orders: [], hasNext: true } })).toThrow();
  });
  it("rejects malformed envelopes, required amounts and missing IDs", async () => {
    for (const response of [null, {}, { status: "error", data: { orders: [], hasNext: false } },
      { status: "ok", data: { orders: [], hasNext: "false" } },
      { status: "ok", data: { orders: [{ ...analyticsOrders[0], id: undefined }], hasNext: false } },
      { status: "ok", data: { orders: [{ ...analyticsOrders[0], price: "12" }], hasNext: false } }]) {
      get.mockResolvedValue({ data: response });
      await expect(fetchOrdersPage("session")).rejects.toMatchObject({ response: { status: 502 } });
    }
    for (const bad of [NaN, Infinity, 1e20]) {
      expect(() => normalizeOrders([{ ...analyticsOrders[0], price: bad }])).toThrow();
    }
  });
  it("normalizes missing optional metadata without inventing amounts or final delivery status", () => {
    const orders = normalizeOrders([{ ...analyticsOrders[0], status: "new-status", tip: "1", platform: 123,
      restaurant: { ...analyticsOrders[0].restaurant, latitude: "38" }, submission_date: "2026-02-30 10:00:00" }]);
    expect(orders[0]).toMatchObject({ status: "new-status", tip: null, submission_date: null });
    expect(orders[0].platform).toBeUndefined();
    expect(orders[0].restaurant.latitude).toBeNull();
  });
  it("accepts signed discount lines and fractional product quantities", () => {
    const order = { ...analyticsOrders[0], products: [{ item_code: "", name: "Adjustment", quantity: 0.5, unit_price: -2 }] };
    expect(normalizeOrders([order])[0].products[0].unit_price).toBe(-2);
    expect(() => normalizeOrders([{ ...order, products: [{ ...order.products[0], quantity: -1 }] }])).toThrow();
  });
});
