import { beforeEach, describe, expect, it } from "vitest";
import { LOCAL_STORAGE_ORDERS } from "./constants";
import { getStoredOrders } from "./ordersStorage";
import { testOrders } from "../test/fixtures";

describe("analytics cache", () => {
  beforeEach(() => { localStorage.clear(); });

  it("invalidates old totals so they will be fetched with the corrected calculations", () => {
    const { cacheVersion: _version, ...oldCache } = testOrders;
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(oldCache));
    expect(getStoredOrders()).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
  });

  it("restores current analytics and their successful sync timestamp", () => {
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
    expect(getStoredOrders()).toEqual(testOrders);
  });

  it("discards corrupt JSON and invalid timestamps without crashing startup", () => {
    for (const raw of ["{broken", "null", JSON.stringify({ ...testOrders, timestamp: "invalid" })]) {
      localStorage.setItem(LOCAL_STORAGE_ORDERS, raw);
      expect(getStoredOrders()).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
    }
  });
});
