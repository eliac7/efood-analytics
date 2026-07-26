import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserReducer } from "./UserReducer";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";
import { testOrders, testUser } from "../../test/fixtures";
import { initialStateType } from "../../types";

const emptyState: initialStateType = {
  user: null,
  orders: null,
  loading: false,
};

describe("UserReducer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("stores orders with a refresh timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00"));

    const nextState = UserReducer(emptyState, {
      type: "SET_ORDERS",
      payload: { all: testOrders.all, perYear: testOrders.perYear },
    });

    expect(nextState.orders?.all.totalOrders).toBe(4);
    expect(nextState.orders?.timestamp).toEqual(new Date("2026-01-01T12:00:00"));
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS) || "null")).toMatchObject({
      all: { totalOrders: 4 },
      perYear: [{ year: "2025" }, { year: "2024" }],
    });
  });

  it("updates an existing orders timestamp and leaves missing orders unchanged", () => {
    const withOrders: initialStateType = {
      ...emptyState,
      orders: testOrders,
    };
    const timestamp = new Date("2026-01-01T13:00:00").getTime();

    expect(
      UserReducer(withOrders, {
        type: "SET_ORDERS_TIMESTAMP",
        payload: timestamp,
      }).orders?.timestamp
    ).toEqual(new Date(timestamp));

    expect(
      UserReducer(emptyState, {
        type: "SET_ORDERS_TIMESTAMP",
        payload: timestamp,
      })
    ).toBe(emptyState);
  });

  it("stores users with login time and clears localStorage on logout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00"));

    const loggedIn = UserReducer(emptyState, {
      type: "SET_USER",
      payload: testUser,
    });

    expect(loggedIn.user).toMatchObject({
      session_id: testUser.session_id,
      name: testUser.name,
      loginAt: new Date("2026-01-01T12:00:00").getTime(),
    });
    expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER) || "null")).toMatchObject({
      name: testUser.name,
    });

    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
    const loggedOut = UserReducer(
      { ...loggedIn, orders: testOrders },
      { type: "LOGOUT" }
    );

    expect(loggedOut.user).toBeNull();
    expect(loggedOut.orders).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_USER)).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
  });

  it("sets loading state", () => {
    expect(
      UserReducer(emptyState, { type: "SET_LOADING", payload: true }).loading
    ).toBe(true);
  });
});
