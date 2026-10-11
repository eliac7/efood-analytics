import { beforeEach, describe, expect, it, vi } from "vitest";
import { getInitialUserState, getStoredUser } from "./userStorage";
import { LOCAL_STORAGE_USER, LOCAL_STORAGE_ORDERS, USER_SESSION_TTL_MS } from "./constants";
import { testOrders, testUser } from "../test/fixtures";

describe("stored session", () => {
  beforeEach(() => { localStorage.clear(); });

  it("loads the current user and only their analytics", () => {
    const user = { ...testUser, loginAt: Date.now() - 1000 };
    localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify({ ...testOrders, ownerLoginAt: user.loginAt }));
    expect(getInitialUserState()).toMatchObject({ user, orders: { all: testOrders.all }, loading: false });
  });

  it("purges malformed, expired, and future sessions with their analytics", () => {
    for (const raw of ["{broken", "null", JSON.stringify({ session_id: testUser.session_id }),
      JSON.stringify({ ...testUser, session_id: "invalid" }),
      JSON.stringify({ ...testUser, loginAt: Date.now() + 60000 }),
      JSON.stringify({ ...testUser, loginAt: Date.now() - USER_SESSION_TTL_MS })]) {
      localStorage.setItem(LOCAL_STORAGE_USER, raw);
      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
      expect(getStoredUser()).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_USER)).toBeNull();
      expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
    }
  });

  it("starts anonymously if access to storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Access denied"); });
    try { expect(getInitialUserState()).toMatchObject({ user: null, orders: null, loading: false }); }
    finally { spy.mockRestore(); }
  });
});
