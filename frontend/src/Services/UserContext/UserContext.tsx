import { createContext, useReducer, useEffect } from "react";
import { initialStateType } from "../../types/app_types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";
import { UserReducer } from "../Reducers/UserReducer";

const initialState = {
  user: JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER) || "null"),
  orders: JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS) || "null"),
  loading: false,
};

interface ExtendedInitialStateType {
  state: initialStateType;
  dispatch: React.Dispatch<any>;
}

export const UserContext = createContext<ExtendedInitialStateType>({
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
