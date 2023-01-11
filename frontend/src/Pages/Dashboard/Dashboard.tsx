import { useState, useEffect, useContext } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container, Select } from "@mantine/core";
import Loading from "../../Components/Loading/Loading";
import { LOCAL_STORAGE_ORDERS } from "../../utils/constants";
import { All, Orders, PerYear } from "../../types/app_types";
import DashboardCard from "./Card/DashboardCard";
import { AiOutlineShoppingCart, AiOutlineFire } from "react-icons/ai";
import { BsPiggyBank } from "react-icons/bs";
import { FaHandsHelping } from "react-icons/fa";
import { CgRowLast } from "react-icons/cg";
import { GoGraph } from "react-icons/go";
import Map from "./Map/Map";
import { dateFormat, formatAmount } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";

function Dashboard() {
  const { state, dispatch } = useContext(UserContext);
  const { user, orders: ordersState } = state;

  const [years, setYears] = useState<
    {
      label: string;
      value: string;
    }[]
  >([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedYearOrders, setSelectedYearOrders] = useState<All | PerYear>();

  const setYearsState = (orders: Orders) => {
    const years = orders.perYear.map((year: PerYear) => {
      return { label: year.year, value: year.year };
    });
    years.unshift({ label: "Όλα τα έτη", value: "all" });
    setYears(years);
    setSelectedYear(years[0].value);
  };

  async function fetchOrders() {
    return await EfoodAxios.get("/orders", {
      headers: {
        session_id: user?.session_id,
      },
    });
  }
  const { data, refetch, isInitialLoading, isRefetching } = useQuery(
    ["orders"],
    fetchOrders,
    {
      refetchOnWindowFocus: false,
      enabled: user?.session_id && !ordersState?.all ? true : false,
    }
  );

  const isLoading = isInitialLoading || isRefetching;

  useEffect(() => {
    if (ordersState?.all) {
      setYearsState(ordersState);
    }
  }, [ordersState]);

  useEffect(() => {
    if (data) {
      dispatch({ type: "SET_ORDERS", payload: data.data.orders });
      setYearsState(data.data.orders);
    }
  }, [data]);

  useEffect(() => {
    if (selectedYear === "all") {
      setSelectedYearOrders(ordersState?.all);
    } else {
      setSelectedYearOrders(
        ordersState?.perYear.find((year: PerYear) => year.year === selectedYear)
      );
    }
  }, [selectedYear]);

  return (
    <>
      {isLoading && <Loading isLoading={isLoading} />}
      <DefaultLayout>
        <Container
          className="
          min-w-[70%]
          p-4
         bg-white rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-20 shadow-xl
      "
        >
          <div className="flex justify-between items-center">
            <Select
              label="Επιλογή Έτους"
              placeholder="Επιλογή Έτους"
              data={years}
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ zIndex: 401 }}
            ></Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            <DashboardCard
              title="Πρώτη παραγγελία"
              value={
                selectedYearOrders?.firstOrder &&
                dateFormat(selectedYearOrders?.firstOrder)
              }
              icon={<AiOutlineFire size={40} />}
              color="bg-white-200"
            />
            <DashboardCard
              title="Τελευταία παραγγελία"
              value={
                selectedYearOrders?.lastOrder &&
                dateFormat(selectedYearOrders?.lastOrder)
              }
              icon={<CgRowLast size={40} />}
              color="bg-slate-900"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
            <DashboardCard
              title="Συνολικές Παραγγελίες"
              value={selectedYearOrders?.totalOrders}
              icon={<AiOutlineShoppingCart size={40} />}
              color="bg-green-500"
            />
            <DashboardCard
              title="Συνολική Δαπάνη"
              value={
                selectedYearOrders?.totalPrice &&
                formatAmount(selectedYearOrders?.totalPrice)
              }
              color="bg-red-600"
              icon={<BsPiggyBank size={40} />}
            />
            <DashboardCard
              title="Μέσος Όρος / Παραγγελία"
              value={
                selectedYearOrders?.totalPrice &&
                selectedYearOrders?.totalOrders &&
                formatAmount(
                  selectedYearOrders?.totalPrice /
                    selectedYearOrders?.totalOrders
                )
              }
              icon={<GoGraph size={40} />}
            />
            <DashboardCard
              title="Συνολικά φιλοδωρήματα"
              value={
                selectedYearOrders?.totalTips &&
                formatAmount(selectedYearOrders?.totalTips)
              }
              icon={<FaHandsHelping size={40} />}
              color="bg-orange-500"
            />
          </div>
          <Map restaurants={selectedYearOrders?.restaurants} />
        </Container>
      </DefaultLayout>
    </>
  );
}

export default Dashboard;
