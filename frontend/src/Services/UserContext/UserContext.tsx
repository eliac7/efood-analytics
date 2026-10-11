import { createContext, useReducer, useEffect } from "react";
import { initialStateType } from "../../types";
import { getInitialUserState } from "../../utils/userStorage";
import { Action, UserReducer } from "../Reducers/UserReducer";
import { USER_SESSION_TTL_MS } from "../../utils/constants";

const initialState: initialStateType = {
  user: null,
  orders: null,
  loading: false,
};

// eslint-disable-next-line react-refresh/only-export-components
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
  const [state, dispatch] = useReducer(UserReducer, undefined, getInitialUserState);

  useEffect(() => {
    if (!state.user?.loginAt) return;

    const remainingMs = USER_SESSION_TTL_MS - (Date.now() - state.user.loginAt);

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
