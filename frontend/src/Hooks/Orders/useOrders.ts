import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";
import { User } from "../../types";
import { parseOrderAnalyticsResponse } from "../../utils/analyticsValidation";

export const useOrders = () => {
  const { state, dispatch } = useContext(UserContext);

  const {
    data,
    mutate,
    isPending: isLoadingOrders,
  } = useMutation({
    mutationFn: async (requestUser: User) => {
      const response = await EfoodAxios.get("/orders", { headers: { session_id: requestUser.session_id } });
      return parseOrderAnalyticsResponse(response.data);
    },
    onSuccess: (orders, requestUser) => dispatch({ type: "SET_ORDERS", payload: orders, requestUser }),
  });

  const fetchOrders = () => {
    if (state.user) mutate(state.user);
  };

  return { orders: state.orders, fetchOrders, isLoadingOrders, data };
};
