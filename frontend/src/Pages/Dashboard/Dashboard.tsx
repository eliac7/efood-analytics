import { useState, useEffect, useContext } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container, Flex, Select } from "@mantine/core";
import Loading from "../../Components/Loading/Loading";
import { All, Orders, PerYear } from "../../types/app_types";
import DashboardCard from "./Cards/DashboardCard";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { BsPiggyBank } from "react-icons/bs";
import {
  FaHandsHelping,
  FaHourglassHalf,
  FaMedal,
  FaTicketAlt,
  FaTruck,
  FaUtensils,
} from "react-icons/fa";
import { CgRowLast } from "react-icons/cg";
import { GoGraph } from "react-icons/go";
import Map from "./Map/Map";
import { dateFormat, formatAmount, timeFormat } from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";
import TimeStampChecker from "./TimeStampChecker/TimeStampChecker";
import { showNotification } from "@mantine/notifications";
import RestaurantCard from "./Cards/RestaurantCard";
import OrderCard from "./Cards/OrderCard";
import PlatformChart from "./Charts/PlatformAndPaymentChart";

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
      showNotification({
        title: `Επιτυχής ανάκτηση δεδομένων`,
        message: `Βρέθηκαν συνολικά ${data.data.orders.all.totalOrders} παραγγελίες`,
        color: "green",
        icon: <GoGraph />,
      });
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
          max-w-7xl mx-auto
          p-4
         bg-white-200 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-20 shadow-xl
         firefox:bg-opacity-100 firefox:backdrop-filter-none firefox:bg-gray-600
      "
        >
          <Flex justify={"space-between"} align="flex-end">
            <Select
              label="Επιλογή Έτους"
              placeholder="Επιλογή Έτους"
              data={years}
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ zIndex: 401 }}
            />
            <TimeStampChecker refetch={refetch} />
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            <DashboardCard
              title="Πρώτη παραγγελία"
              value={
                selectedYearOrders?.firstOrder &&
                dateFormat(selectedYearOrders?.firstOrder)
              }
              icon={<FaMedal size={40} />}
              color="bg-yellow-500"
            />
            <DashboardCard
              title="Τελευταία παραγγελία"
              value={
                selectedYearOrders?.lastOrder &&
                dateFormat(selectedYearOrders?.lastOrder)
              }
              icon={<CgRowLast size={40} />}
              color="bg-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 my-4">
            {selectedYearOrders?.deliveryCost ? (
              <DashboardCard
                title="Συνολικά Έξοδα Παράδοσης"
                value={formatAmount(selectedYearOrders?.deliveryCost)}
                icon={<FaTruck size={40} />}
                color="bg-purple-500"
              />
            ) : (
              <DashboardCard
                title="Συνολικά Έξοδα Παράδοσης"
                value="Δεν υπάρχουν διαθέσιμα δεδομένα"
                icon={<FaTruck size={40} />}
                color="bg-purple-500"
              />
            )}
            {selectedYearOrders?.couponAmount ? (
              <DashboardCard
                title="Συνολικά Έξοδα Κουπονιών"
                value={formatAmount(selectedYearOrders?.couponAmount)}
                icon={<FaTicketAlt size={40} />}
                color="bg-pink-500"
              />
            ) : (
              <DashboardCard
                title="Συνολικά Έξοδα Κουπονιών"
                value="Δεν υπάρχουν διαθέσιμα δεδομένα"
                icon={<FaTicketAlt size={40} />}
                color="bg-pink-500"
              />
            )}
            {selectedYearOrders &&
            "averageDeliveryTime" in selectedYearOrders ? (
              <DashboardCard
                title="Μέσος χρόνος παράδοσης"
                value={
                  selectedYearOrders?.averageDeliveryTime &&
                  timeFormat(selectedYearOrders?.averageDeliveryTime)
                }
                icon={<FaHourglassHalf size={40} />}
                color="bg-indigo-500"
              />
            ) : null}
            {selectedYearOrders && "uniqueRestaurants" in selectedYearOrders ? (
              <DashboardCard
                title="Μοναδικά Εστιατόρια"
                value={selectedYearOrders?.uniqueRestaurants}
                icon={<FaUtensils size={40} />}
                color="bg-yellow-500"
              />
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            {selectedYearOrders?.RestaurantWithMostMoneySpent && (
              <RestaurantCard
                data={selectedYearOrders?.RestaurantWithMostMoneySpent}
              />
            )}
            {selectedYearOrders?.mostOrderedProduct && (
              <OrderCard data={selectedYearOrders?.mostOrderedProduct} />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            {selectedYearOrders?.platforms && (
              <PlatformChart
                data={selectedYearOrders?.platforms}
                title="Πλατφόρμες παραγγελιών"
                color="bg-blue-500"
              />
            )}
            {selectedYearOrders?.paymentMethods && (
              <PlatformChart
                data={selectedYearOrders?.paymentMethods}
                title="Τρόποι Πληρωμής"
                color="bg-green-500"
              />
            )}
          </div>

          <Map restaurants={selectedYearOrders?.restaurants} />
        </Container>
      </DefaultLayout>
    </>
  );
}

export default Dashboard;
