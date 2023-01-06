import { createContext, useReducer, useEffect } from "react";

import {
  initialState,
  initialStateType,
  Orders,
  User,
} from "../../types/app_types";
import {
  LOCAL_STORAGE_ORDERS,
  LOCAL_STORAGE_USER,
} from "../../utils/constants";
import { UserReducer } from "../Reducers/UserReducer";

export const UserContext = createContext<{
  state: initialStateType;
  dispatch: React.Dispatch<any>;
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

  useEffect(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_USER);
    if (storedUser) {
      dispatch({
        type: "SET_USER",
        payload: JSON.parse(storedUser),
      });
    }

    const storedOrders = localStorage.getItem(LOCAL_STORAGE_ORDERS);
    if (storedOrders) {
      dispatch({
        type: "SET_ORDERS",
        payload: JSON.parse(storedOrders),
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
