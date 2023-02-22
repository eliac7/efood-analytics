import { useContext, useEffect } from "react";
import { showNotification } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";
import { FiLogIn, FiLogOut } from "react-icons/fi";

export const useAuth = () => {
  const { state, dispatch } = useContext(UserContext);

  const { mutate: loginWithEmail, isLoading: isEmailLoading } = useMutation(
    (values: { email: string; password: string }) =>
      EfoodAxios.post("/login", values),
    {
      onSuccess: (data) => {
        dispatch({ type: "SET_USER", payload: data.data });
        showNotification({
          title: "Επιτυχία",
          message: "Επιτυχής σύνδεση",
          color: "green",
          icon: <FiLogIn />,
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

  const { mutate: loginWithSession, isLoading: isSessionLoading } = useMutation(
    (session_id: string) => EfoodAxios.post("/login/session", { session_id }),
    {
      onSuccess: (data) => {
        dispatch({ type: "SET_USER", payload: data.data });
        showNotification({
          title: "Επιτυχία",
          message: "Επιτυχής σύνδεση χρησιμοποιώντας το id σας",
          color: "green",
          icon: <FiLogIn />,
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
    if (isEmailLoading || isSessionLoading) {
      dispatch({ type: "SET_LOADING", payload: true });
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [isEmailLoading, isSessionLoading]);

  const login = (email: string, password: string) => {
    loginWithEmail({ email, password });
  };

  const loginWithSessionId = (sessionId: string) => {
    loginWithSession(sessionId);
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    showNotification({
      title: "Επιτυχής αποσύνδεση",
      message: "Ελπίζουμε να σας ξαναδούμε σύντομα",
      color: "green",
      icon: <FiLogOut />,
    });
  };

  return {
    user: state.user,
    login,
    loginWithSessionId,
    logout,
    loading: state.loading,
  };
};
