import { beforeEach, describe, expect, it } from "vitest";
import { LOCAL_STORAGE_ORDERS } from "./constants";
import { getStoredOrders } from "./ordersStorage";
import { testOrders, testUser } from "../test/fixtures";

describe("analytics cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("invalidates old totals so they will be fetched with the corrected calculations", () => {
    const { cacheVersion: _version, ...oldCache } = testOrders;
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(oldCache));
    expect(getStoredOrders(testUser)).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
  });

  it("restores current analytics and their successful sync timestamp", () => {
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
    expect(getStoredOrders(testUser)).toEqual(testOrders);
  });

  it("discards corrupt JSON and invalid timestamps without crashing startup", () => {
    for (const raw of [
      "{broken",
      "null",
      JSON.stringify({ ...testOrders, timestamp: "invalid" }),
      JSON.stringify({
        ...testOrders,
        timestamp: new Date(Date.now() + 86400000),
      }),
    ]) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, raw);
      expect(getStoredOrders(testUser)).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
    }
  });

  it("discards another account's cache and caches from a previous login", () => {
    for (const user of [
      null,
      { ...testUser, loginAt: testUser.loginAt! + 1 },
      { ...testUser, session_id: "11111111-1111-1111-1111-111111111111" },
    ]) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
      expect(getStoredOrders(user)).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
    }
  });

  it("rejects incomplete analytics even if metadata is current", () => {
    for (const all of [
      {},
      { ...testOrders.all, restaurants: null },
      { ...testOrders.all, totalPrice: "49.74" },
      { ...testOrders.all, mostOrderedProduct: {} },
    ]) {
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS,
        JSON.stringify({ ...testOrders, all }),
      );
      expect(getStoredOrders(testUser)).toBeNull();
    }
  });

  it("rejects missing breakdowns or inconsistent cost coverage", () => {
    const cost = testOrders.all.costBreakdown;
    for (const costBreakdown of [
      undefined,
      {},
      {
        ...cost,
        additionalCharges: { amount: 1, knownAmount: 1, coveredOrders: 99 },
      },
      {
        ...cost,
        reconciliation: { ...cost.reconciliation, matchedOrders: 999 },
      },
    ]) {
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS,
        JSON.stringify({
          ...testOrders,
          all: { ...testOrders.all, costBreakdown },
        }),
      );
      expect(getStoredOrders(testUser)).toBeNull();
    }
  });

  it("invalidates version 3 analytics so cost analysis is fetched", () => {
    localStorage.setItem(
      LOCAL_STORAGE_ORDERS,
      JSON.stringify({ ...testOrders, cacheVersion: 3 }),
    );
    expect(getStoredOrders(testUser)).toBeNull();
  });

  it("invalidates version 4 analytics so spending timelines are fetched", () => {
    localStorage.setItem(
      LOCAL_STORAGE_ORDERS,
      JSON.stringify({ ...testOrders, cacheVersion: 4 }),
    );
    expect(getStoredOrders(testUser)).toBeNull();
  });

  it("invalidates version 5 and rejects incomplete or unsafe history", () => {
    for (const change of [
      { cacheVersion: 5 },
      { history: undefined },
      { history: testOrders.history.slice(1) },
      {
        history: testOrders.history.map((entry, i) =>
          i === 0 ? { ...entry, price: 99 } : entry,
        ),
      },
      {
        history: testOrders.history.map((entry) => ({
          ...entry,
          id: "duplicate",
        })),
      },
      {
        history: testOrders.history.map((entry) => ({
          ...entry,
          delivery_address: { street: "private" },
        })),
      },
      {
        history: testOrders.history.map((entry) => ({
          ...entry,
          products: entry.products.map((product) => ({
            ...product,
            customisation: "private",
          })),
        })),
      },
    ]) {
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS,
        JSON.stringify({ ...testOrders, ...change }),
      );
      expect(getStoredOrders(testUser)).toBeNull();
    }
  });

  it("rejects missing timelines, impossible dates and mismatched allocated totals", () => {
    const timeline = testOrders.timeline;
    for (const invalid of [
      undefined,
      {},
      { ...timeline, asOf: "bad" },
      {
        ...timeline,
        coverage: { ...timeline.coverage, through: "2026-02-30" },
      },
      { ...timeline, months: timeline.months.slice(1) },
      {
        ...timeline,
        weeks: timeline.weeks.map((b, i) =>
          i === 0 ? { ...b, totalOrders: 999 } : b,
        ),
      },
      {
        ...timeline,
        comparisons: timeline.comparisons.map((c, i) =>
          i === 0 ? { ...c, days: 30 } : c,
        ),
      },
    ]) {
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS,
        JSON.stringify({ ...testOrders, timeline: invalid }),
      );
      expect(getStoredOrders(testUser)).toBeNull();
    }
  });
});
