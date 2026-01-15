import { createContext, useReducer, useEffect } from "react";
import { initialStateType, Orders, User } from "../../types/app_types";
import { Action, UserReducer } from "../Reducers/UserReducer";
import {
  LOCAL_STORAGE_USER,
  LOCAL_STORAGE_ORDERS,
  USER_SESSION_TTL_MS,
} from "../../utils/constants";

const getStoredUser = (): User | null => {
  const rawUser = localStorage.getItem(LOCAL_STORAGE_USER);
  if (!rawUser) return null;

  try {
    const parsedUser = JSON.parse(rawUser) as User;
    const loginAt = parsedUser.loginAt;

    if (!loginAt || typeof loginAt !== "number") {
      localStorage.removeItem(LOCAL_STORAGE_USER);
      localStorage.removeItem(LOCAL_STORAGE_ORDERS);
      return null;
    }

    if (Date.now() - loginAt > USER_SESSION_TTL_MS) {
      localStorage.removeItem(LOCAL_STORAGE_USER);
      localStorage.removeItem(LOCAL_STORAGE_ORDERS);
      return null;
    }

    return parsedUser;
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_USER);
    localStorage.removeItem(LOCAL_STORAGE_ORDERS);
    return null;
  }
};

const initialState: initialStateType = {
  user: getStoredUser(),
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

  useEffect(() => {
    if (!state.user?.loginAt) return;

    const remainingMs =
      USER_SESSION_TTL_MS - (Date.now() - state.user.loginAt);

    if (remainingMs <= 0) {
      dispatch({ type: "LOGOUT" });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "LOGOUT" });
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [state.user?.loginAt]);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};
