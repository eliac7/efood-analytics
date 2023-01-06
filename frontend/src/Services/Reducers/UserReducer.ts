import { initialStateType } from "../../types/app_types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";

const setUserAndLocalStorage = (
  state: initialStateType,
  {
    payload: { name, session_id },
  }: { payload: { name: string; session_id: string } }
) => {
  const user = { name, session_id };

  localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));

  return { ...state, user, loading: false };
};

export const UserReducer = (state: initialStateType, action: any) => {
  switch (action.type) {
    case "SET_ORDERS":
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS,
        JSON.stringify(action.payload)
      );
      return {
        ...state,
        orders: action.payload,
      };

    case "SET_USER":
      return setUserAndLocalStorage(state, action);

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "LOGOUT":
      localStorage.removeItem(LOCAL_STORAGE_USER);
      localStorage.removeItem(LOCAL_STORAGE_ORDERS);
      return { ...state, user: null, orders: [] };

    default:
      return state;
  }
};
