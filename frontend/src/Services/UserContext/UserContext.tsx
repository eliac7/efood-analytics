import { createContext, useReducer, useEffect } from "react";
import { initialStateType } from "../../types/app_types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";
import { Action, UserReducer } from "../Reducers/UserReducer";

const initialState = {
  user: JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER) || "null"),
  orders: JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS) || "null"),
  loading: false,
  session_id: null,
};

export const UserContext = createContext<{
  state: initialStateType;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});
export const UserContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer<initialStateType, Action>(
    UserReducer,
    initialState,
    (initialState) => initialState
  );

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
