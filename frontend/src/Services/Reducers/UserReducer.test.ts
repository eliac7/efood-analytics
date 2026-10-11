import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserReducer } from "./UserReducer";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
  ORDERS_CACHE_VERSION,
} from "../../utils/constants";
import {
  makeTestHistory,
  makeTestTimeline,
  testOrders,
  testUser,
} from "../../test/fixtures";
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

    const nextState = UserReducer(
      { ...emptyState, user: testUser },
      {
        type: "SET_ORDERS",
        payload: {
          all: testOrders.all,
          perYear: testOrders.perYear,
          timeline: testOrders.timeline,
          history: testOrders.history,
        },
        requestUser: testUser,
      },
    );

    expect(nextState.orders?.all.totalOrders).toBe(4);
    expect(nextState.orders?.timestamp).toEqual(
      new Date("2026-01-01T12:00:00"),
    );
    expect(
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS) || "null"),
    ).toMatchObject({
      all: { totalOrders: 4 },
      perYear: [{ year: "2025" }, { year: "2024" }],
      timeline: testOrders.timeline,
      cacheVersion: ORDERS_CACHE_VERSION,
    });
  });

  it("replaces analytics and the persisted timestamp together after a successful fetch", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T13:00:00");
    vi.setSystemTime(now);
    const withOrders: initialStateType = {
      ...emptyState,
      user: testUser,
      orders: testOrders,
    };
    const updatedAll = { ...testOrders.all, totalOrders: 5 };
    const next = UserReducer(withOrders, {
      type: "SET_ORDERS",
      payload: {
        all: updatedAll,
        perYear: testOrders.perYear,
        timeline: makeTestTimeline(5),
        history: makeTestHistory(5),
      },
      requestUser: testUser,
    });
    expect(next.orders?.timestamp).toEqual(now);
    expect(next.orders?.all.totalOrders).toBe(5);
    expect(withOrders.orders?.timestamp).toEqual(testOrders.timestamp);
    expect(
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS)!),
    ).toMatchObject({
      all: { totalOrders: 5 },
      timestamp: now.toISOString(),
    });
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
    expect(
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER) || "null"),
    ).toMatchObject({
      name: testUser.name,
    });

    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(testOrders));
    const loggedOut = UserReducer(
      { ...loggedIn, orders: testOrders },
      { type: "LOGOUT" },
    );

    expect(loggedOut.user).toBeNull();
    expect(loggedOut.orders).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_USER)).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
  });

  it("sets loading state", () => {
    expect(
      UserReducer(emptyState, { type: "SET_LOADING", payload: true }).loading,
    ).toBe(true);
  });

  it("ignores late orders after logout or a new login, including the same session ID", () => {
    const action = {
      type: "SET_ORDERS" as const,
      payload: testOrders,
      requestUser: testUser,
    };
    const loggedOut = UserReducer(
      { ...emptyState, user: testUser },
      { type: "LOGOUT" },
    );
    expect(UserReducer(loggedOut, action)).toBe(loggedOut);
    const loggedInAgain = {
      ...emptyState,
      user: { ...testUser, loginAt: testUser.loginAt! + 1 },
    };
    expect(UserReducer(loggedInAgain, action)).toBe(loggedInAgain);
    const otherUser = {
      ...emptyState,
      user: { ...testUser, session_id: "11111111-1111-1111-1111-111111111111" },
    };
    expect(UserReducer(otherUser, action)).toBe(otherUser);
    expect(localStorage.getItem(LOCAL_STORAGE_ORDERS)).toBeNull();
  });

  it("ignores old login and loading completions after logout", () => {
    const loggedOut = UserReducer(emptyState, { type: "LOGOUT" });
    const pendingLogin = {
      type: "SET_USER" as const,
      payload: testUser,
      authRevision: 0,
    };
    expect(UserReducer(loggedOut, pendingLogin)).toBe(loggedOut);
    const nextLogin = UserReducer(loggedOut, {
      type: "SET_LOADING",
      payload: true,
      authRevision: 1,
    });
    expect(
      UserReducer(nextLogin, {
        type: "SET_LOADING",
        payload: false,
        authRevision: 0,
      }),
    ).toBe(nextLogin);
    expect(localStorage.getItem(LOCAL_STORAGE_USER)).toBeNull();
  });

  it("continues updating in-memory state when browser storage is unavailable", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Quota exceeded");
      });
    try {
      const state = UserReducer(emptyState, {
        type: "SET_USER",
        payload: testUser,
      });
      const next = UserReducer(state, {
        type: "SET_ORDERS",
        payload: testOrders,
        requestUser: state.user!,
      });
      expect(next.orders?.all.totalOrders).toBe(4);
    } finally {
      spy.mockRestore();
    }
  });
});
