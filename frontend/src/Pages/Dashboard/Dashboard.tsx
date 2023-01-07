import { useState, useEffect } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container, Select } from "@mantine/core";
import Loading from "../../Components/Loading/Loading";
import { useOrders } from "../../Hooks/Orders/useOrders";
import { LOCAL_STORAGE_ORDERS } from "../../utils/constants";
import { All, Orders, PerYear } from "../../types/app_types";
import DashboardCard from "./Card/DashboardCard";

function Dashboard() {
  type years = {
    label: string;
    value: string;
  };

  const [years, setYears] = useState<years[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedYearOrders, setSelectedYearOrders] = useState<
    All | PerYear | undefined
  >(undefined);
  const { fetchOrders, isLoadingOrders, data, orders } = useOrders();

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
      setYearsState(JSON.parse(orders));
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

  // every time we change the selected year we set the selected year orders state with the orders of the selected year. If the value is all we set the selected year orders state with all the orders
  useEffect(() => {
    if (selectedYear) {
      if (selectedYear === "all") {
        setSelectedYearOrders(orders?.all);
      } else {
        const selectedYearOrders = orders?.perYear.find(
          (year) => year.year === selectedYear
        );
        setSelectedYearOrders(selectedYearOrders);
      }
    }
  }, [selectedYear, orders]);

  return (
    <>
      <Loading isLoading={isLoadingOrders} />
      <DefaultLayout>
        <Container
          className="
          grow
          
        p-4
        bg-white
        dark:bg-slate-700
        rounded-md
        shadow-md
        border
        border-gray-200
        dark:border-gray-600
        
      "
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Παραγγελίες
            </h1>
            <Select
              label="Επιλογή Έτους"
              placeholder="Επιλογή Έτους"
              data={years}
              value={selectedYear}
              onChange={setSelectedYear}
            ></Select>
          </div>
        </Container>
      </DefaultLayout>
    </>
  );
}

export default Dashboard;
