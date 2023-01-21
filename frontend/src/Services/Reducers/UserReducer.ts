import { All, initialStateType, PerYear, User } from "../../types/app_types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";

export type Action =
  | { type: "SET_ORDERS"; payload: { all: All; perYear: PerYear } }
  | { type: "SET_ORDERS_TIMESTAMP"; payload: number }
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
    case "SET_ORDERS":
      const { all, perYear } = action.payload;
      const timestamp = new Date();
      const orders = { all, perYear: [perYear], timestamp };

      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(orders));
      return {
        ...state,
        orders,
      };

    case "SET_ORDERS_TIMESTAMP":
      if (state.orders) {
        return {
          ...state,
          orders: {
            ...state.orders,
            timestamp: new Date(action.payload),
          },
        };
      }

    case "SET_USER":
      const user = { ...(action.payload as User) };
      localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
      return { ...state, user, loading: false };

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
