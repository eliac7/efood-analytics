import { useContext, useEffect } from "react";
import { showNotification } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";

export const useAuth = () => {
  const { state, dispatch } = useContext(UserContext);

  const { mutate, isLoading } = useMutation(
    (values: { email: string; password: string }) =>
      EfoodAxios.post("/login", values),
    {
      onSuccess: (data) => {
        dispatch({ type: "SET_USER", payload: data.data });
        showNotification({
          title: "Επιτυχία",
          message: "Επιτυχής σύνδεση",
          color: "green",
        });
      },
      onError: (error: any) => {
        console.log(error);
        showNotification({
          title: "Σφάλμα",
          message: error.response.data.message,
          color: "red",
        });
      },
    }
  );

  useEffect(() => {
    if (isLoading) {
      dispatch({ type: "SET_LOADING", payload: true });
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [isLoading]);

  const login = (email: string, password: string) => {
    mutate({ email, password });
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  return { user: state.user, login, logout, loading: state.loading };
};
