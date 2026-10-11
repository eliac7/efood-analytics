import { initialStateType, Orders, User } from "../../types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
  ORDERS_CACHE_VERSION,
} from "../../utils/constants";
import { writeStorage, removeStorage } from "../../utils/storage";

export type Action =
  | {
      type: "SET_ORDERS";
      payload: Pick<Orders, "all" | "perYear" | "timeline" | "history">;
      requestUser: Pick<User, "session_id" | "loginAt">;
    }
  | {
      type: "SET_USER";
      payload: User;
      authRevision?: number;
    }
  | { type: "SET_LOADING"; payload: boolean; authRevision?: number }
  | { type: "LOGOUT" };

export const UserReducer = (
  state: initialStateType,
  action: Action,
): initialStateType => {
  switch (action.type) {
    case "SET_ORDERS": {
      if (
        !state.user ||
        typeof state.user.loginAt !== "number" ||
        state.user.session_id !== action.requestUser.session_id ||
        state.user.loginAt !== action.requestUser.loginAt
      )
        return state;
      const { all, perYear, timeline, history } = action.payload;

      const timestamp = new Date();
      const orders = {
        all,
        perYear,
        timeline,
        history,
        timestamp,
        cacheVersion: ORDERS_CACHE_VERSION,
        ownerSessionId: state.user.session_id,
        ownerLoginAt: state.user.loginAt,
      };

      writeStorage(LOCAL_STORAGE_ORDERS, orders);
      return {
        ...state,
        orders,
      };
    }
    case "SET_USER": {
      if (
        action.authRevision !== undefined &&
        action.authRevision !== (state.authRevision ?? 0)
      )
        return state;
      const user = { ...(action.payload as User), loginAt: Date.now() };
      writeStorage(LOCAL_STORAGE_USER, user);
      removeStorage(LOCAL_STORAGE_ORDERS);
      return {
        ...state,
        user,
        orders: null,
        loading: false,
        authRevision: (state.authRevision ?? 0) + 1,
      };
    }

    case "SET_LOADING":
      if (
        action.authRevision !== undefined &&
        action.authRevision !== (state.authRevision ?? 0)
      )
        return state;
      return { ...state, loading: action.payload };

    case "LOGOUT":
      removeStorage(LOCAL_STORAGE_USER);
      removeStorage(LOCAL_STORAGE_ORDERS);
      return {
        ...state,
        user: null,
        orders: null,
        loading: false,
        authRevision: (state.authRevision ?? 0) + 1,
      };

    default:
      return state;
  }
};
