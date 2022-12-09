import { useEffect, useContext } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../Services/UserContext/UserContext";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { showNotification } from "@mantine/notifications";
import { Card, Image, Text, Badge, Button, Group } from "@mantine/core";

function Dashboard() {
  const navigate = useNavigate();
  const { state, dispatch } = useContext(UserContext);

  const getOrders = async () => {
    try {
      const { data } = await EfoodAxios.get("orders", {
        headers: {
          session_id: state.user?.session_id,
        },
      });
      dispatch({ type: "SET_ORDERS", payload: data });
    } catch (error: any) {
      showNotification({
        title: "Αποτυχία",
        message: error.response.data.message || error.message,
        color: "red",
      });
      navigate("/");
    }
  };

  useEffect(() => {
    if (!state?.user) {
      navigate("/");
    } else {
      getOrders();
    }
  }, [state?.user, navigate]);

  return (
    <DefaultLayout>
      <Card shadow="sm" radius="md">
        <Text size="xl" weight={700}>
          Παραγγελίες
        </Text>
      </Card>
    </DefaultLayout>
  );
}

export default Dashboard;
