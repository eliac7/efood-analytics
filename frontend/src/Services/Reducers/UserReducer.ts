import { initialStateType } from "../UserContext/UserContext";

const setUserAndLocalStorage = (state: initialStateType, action: any) => {
  const { name, session_id } = action.payload;
  const user = { name, session_id };
  localStorage.setItem("user", JSON.stringify(user));
  return { ...state, user };
};

export const UserReducer = (state: initialStateType, action: any) => {
  switch (action.type) {
    case "SET_ORDERS":
      return { ...state, orders: action.payload };
    case "SET_USER":
      return setUserAndLocalStorage(state, action);
    case "LOGOUT":
      return { ...state, user: null, orders: [] };
    default:
      return state;
  }
};
