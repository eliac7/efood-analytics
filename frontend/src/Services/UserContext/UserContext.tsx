import { createContext, useReducer, useEffect } from "react";
import { initialStateType, Orders, User } from "../../types/app_types";
import { Action, UserReducer } from "../Reducers/UserReducer";
import {
  LOCAL_STORAGE_USER,
  LOCAL_STORAGE_ORDERS,
} from "../../utils/constants";

const initialState: initialStateType = {
  user: JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_USER) ?? "null"
  ) as User | null,
  orders: JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_ORDERS) ?? "null"
  ) as Orders | null,
  loading: false,
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
  const [state, dispatch] = useReducer(UserReducer, initialState);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
