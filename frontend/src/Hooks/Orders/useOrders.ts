import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";

export const useOrders = () => {
  const { state, dispatch } = useContext(UserContext);

  const session_id = state.user?.session_id;

  const {
    data,
    mutate,
    isLoading: isLoadingOrders,
  } = useMutation(
    () => EfoodAxios.get("/orders", { headers: { session_id } }),
    {
      onSuccess: (data) => {
        dispatch({ type: "SET_ORDERS", payload: data.data.orders });
      },
      onError: (error: any) => {
        console.log(error);
      },
    }
  );

  const fetchOrders = () => {
    mutate();
  };

  return { orders: state.orders, fetchOrders, isLoadingOrders, data };
};
