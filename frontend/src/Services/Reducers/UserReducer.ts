import { initialStateType, OrderStats, PerYear, User } from "../../types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
  ORDERS_CACHE_VERSION,
} from "../../utils/constants";

export type Action =
  | {
      type: "SET_ORDERS";
      payload: { all: OrderStats; perYear: PerYear[] };
    }
  | {
      type: "SET_USER";
      payload: User;
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGOUT" };

export const UserReducer = (
  state: initialStateType,
  action: Action
): initialStateType => {
  switch (action.type) {
    case "SET_ORDERS": {
      const { all, perYear } = action.payload;

      const timestamp = new Date();
      const orders = { all, perYear, timestamp, cacheVersion: ORDERS_CACHE_VERSION };

      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(orders));
      return {
        ...state,
        orders,
      };
    }
    case "SET_USER": {
      const user = { ...(action.payload as User), loginAt: Date.now() };
      localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
      return { ...state, user, loading: false };
    }

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "LOGOUT":
      localStorage.removeItem(LOCAL_STORAGE_USER);
      localStorage.removeItem(LOCAL_STORAGE_ORDERS);
      return { ...state, user: null, orders: null };

    default:
      return state;
  }
};
