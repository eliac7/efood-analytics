import { createContext, useReducer } from "react";

import { Order, User } from "../../types/app_types";
import { UserReducer } from "../Reducers/UserReducer";

export type initialStateType = {
  user: User | null;
  orders: Order[];
  session_id: string | null;
};

const initialState = {
  user: null,
  orders: [],
  session_id: null,
};

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

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
