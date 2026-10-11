import { beforeEach, describe, expect, it } from "vitest";
import { LOCAL_STORAGE_ORDERS } from "./constants";
import { getStoredOrders } from "./ordersStorage";
import { testOrders, testUser } from "../test/fixtures";

describe("analytics cache", () => {
  beforeEach(() => { localStorage.clear(); });

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
    for (const raw of ["{broken", "null", JSON.stringify({ ...testOrders, timestamp: "invalid" }),
      JSON.stringify({ ...testOrders, timestamp: new Date(Date.now() + 86400000) })]) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, raw);
      expect(getStoredOrders(testUser)).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
    }
  });

  it("discards another account's cache and caches from a previous login", () => {
    for (const user of [null, { ...testUser, loginAt: testUser.loginAt! + 1 },
      { ...testUser, session_id: "11111111-1111-1111-1111-111111111111" }]) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
      expect(getStoredOrders(user)).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
    }
  });

  it("rejects incomplete analytics even if metadata is current", () => {
    for (const all of [{}, { ...testOrders.all, restaurants: null },
      { ...testOrders.all, totalPrice: "49.74" }, { ...testOrders.all, mostOrderedProduct: {} }]) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify({ ...testOrders, all }));
      expect(getStoredOrders(testUser)).toBeNull();
    }
  });
});
