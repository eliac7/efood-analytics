import { useContext, useEffect, useRef } from "react";
import { showNotification } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { isUser } from "../../utils/analyticsValidation";
import { isAxiosError } from "axios";

type AuthRequest = ({ kind: "email"; email: string; password: string } | { kind: "session"; session_id: string }) & { revision: number };

export const useAuth = () => {
  const { state, dispatch } = useContext(UserContext);
  const revision = state.authRevision ?? 0;
  const revisionRef = useRef(revision);
  useEffect(() => { revisionRef.current = revision; }, [revision]);
  const { mutate } = useMutation({
    mutationFn: async (input: AuthRequest) => {
      const response = input.kind === "email"
        ? await EfoodAxios.post("/login", { email: input.email, password: input.password })
        : await EfoodAxios.post("/login/session", { session_id: input.session_id });
      if (!isUser(response.data)) throw new Error("Μη έγκυρη απόκριση σύνδεσης.");
      return response.data;
    },
    onSuccess: (user, input) => {
      if (input.revision !== revisionRef.current) return;
      dispatch({ type: "SET_USER", payload: user, authRevision: input.revision });
      showNotification({ title: "Επιτυχία", message: "Επιτυχής σύνδεση", color: "green", icon: <FiLogIn /> });
    },
    onError: (error, input) => {
      if (input.revision !== revisionRef.current) return;
      const serverMessage: unknown = isAxiosError(error) ? error.response?.data?.message : undefined;
      const message = typeof serverMessage === "string" && serverMessage.trim()
        ? serverMessage : "Η σύνδεση απέτυχε. Ελέγξτε τα στοιχεία σας και δοκιμάστε ξανά.";
      showNotification({ title: "Σφάλμα", message, color: "red" });
    },
    onSettled: (_data, _error, input) => {
      dispatch({ type: "SET_LOADING", payload: false, authRevision: input.revision });
    },
  });

  const login = (email: string, password: string) => {
    if (state.loading) return;
    dispatch({ type: "SET_LOADING", payload: true, authRevision: revision });
    mutate({ kind: "email", email: email.trim(), password, revision });
  };
  const loginWithSessionId = (sessionId: string) => {
    if (state.loading) return;
    dispatch({ type: "SET_LOADING", payload: true, authRevision: revision });
    mutate({ kind: "session", session_id: sessionId, revision });
  };
  const logout = () => {
    dispatch({ type: "LOGOUT" });
    showNotification({ title: "Επιτυχής αποσύνδεση", message: "Ελπίζουμε να σας ξαναδούμε σύντομα", color: "green", icon: <FiLogOut /> });
  };
  return { user: state.user, login, loginWithSessionId, logout, loading: state.loading };
};
