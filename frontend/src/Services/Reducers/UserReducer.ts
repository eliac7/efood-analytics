import { initialStateType } from "../../types/app_types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";

export const UserReducer = (state: initialStateType, action: any) => {
  switch (action.type) {
    case "SET_ORDERS":
      const { all, perYear } = action.payload;
      const orders = { all, perYear };

      localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(orders));
      return {
        ...state,
        orders,
      };

    case "SET_USER":
      const { name, session_id } = action.payload;
      const user = { name, session_id };
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
