import { useState, useEffect } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container, Select } from "@mantine/core";
import Loading from "../../Components/Loading/Loading";
import { useOrders } from "../../Hooks/Orders/useOrders";
import { LOCAL_STORAGE_ORDERS } from "../../utils/constants";
import { Orders } from "../../types/app_types";

function Dashboard() {
  type years = {
    label: string;
    value: string;
  };

  const [years, setYears] = useState<years[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const { fetchOrders, isLoadingOrders, data } = useOrders();

  const setYearsState = (orders: Orders) => {
    const years = orders.perYear.map((year: any) => {
      return { label: year.year, value: year.year };
    });
    years.unshift({ label: "Όλα τα έτη", value: "all" });
    setYears(years);
    setSelectedYear(years[0].value);
  };

  // first we need to check if we have orders in local storage
  // if we have we set the years state with the orders from local storage
  // if we don't have we fetch the orders from the server and set the years state with the orders from the server

  useEffect(() => {
    const orders = localStorage.getItem(LOCAL_STORAGE_ORDERS);
    if (orders) {
      setYearsState(JSON.parse(orders).orders);
    } else {
      fetchOrders();
    }
  }, []);

  // if we have orders from the server we set the years state with the orders from the server
  useEffect(() => {
    if (data) {
      setYearsState(data.data?.orders);
    }
  }, [data]);

  return (
    <>
      <Loading isLoading={isLoadingOrders} />
      <DefaultLayout>
        <Container
          className="
        p-4
        bg-white
        dark:bg-slate-800
        rounded-md
        shadow-md
        border
        border-gray-200
        dark:border-gray-600
        
      "
        >
          <Select
            label="Επιλογή Έτους"
            placeholder="Επιλογή Έτους"
            data={years}
            value={selectedYear}
            onChange={setSelectedYear}
          ></Select>
        </Container>
      </DefaultLayout>
    </>
  );
}

export default Dashboard;
