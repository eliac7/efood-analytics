import { useState, useContext, useCallback, useMemo } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Alert, Container, Flex, Select } from "@mantine/core";
import Loading from "../../Components/Loading/Loading";
import { PerYear } from "../../types";
import { parseOrderAnalyticsResponse } from "../../utils/analyticsValidation";
import DashboardCard from "./Cards/DashboardCard";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { BsPiggyBank } from "react-icons/bs";
import {
  FaCity,
  FaClock,
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
import {
  dateFormat,
  formatAmount,
  NO_DATA,
  timeFormat,
} from "../../utils/helpers";
import { useQuery } from "@tanstack/react-query";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import { UserContext } from "../../Services/UserContext/UserContext";
import TimeStampChecker from "./TimeStampChecker/TimeStampChecker";
import { showNotification } from "@mantine/notifications";
import RestaurantCard from "./Cards/RestaurantCard";
import OrderCard from "./Cards/OrderCard";
import PlatformAndPaymentChart from "./Charts/PlatformAndPaymentChart";
import WeekdayChart from "./Charts/WeekdayChart";
import HourCard from "./Cards/HourCard";
import MapCard from "./Cards/MapCard";
import CostBreakdownPanel from "./CostBreakdown/CostBreakdownPanel";
import SpendingPanel from "./Spending/SpendingPanel";

function Dashboard() {
  const { state, dispatch } = useContext(UserContext);
  const { user, orders: ordersState } = state;

  const years = useMemo(() => {
    if (!ordersState?.perYear) return [];
    const yearsList = ordersState.perYear.map((year: PerYear) => {
      return { label: year.year, value: year.year };
    });
    yearsList.unshift({ label: "Όλα τα έτη", value: "all" });
    return yearsList;
  }, [ordersState]);

  const defaultSelectedYear = useMemo(() => {
    return years.length > 0 ? years[0].value : null;
  }, [years]);

  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const effectiveSelectedYear = years.some(
    (year) => year.value === selectedYear,
  )
    ? selectedYear
    : defaultSelectedYear;

  const fetchOrders = useCallback(
    async (signal: AbortSignal) => {
      if (!user?.session_id) {
        throw new Error("Session ID is required");
      }
      const response = await EfoodAxios.get("/orders", {
        signal,
        headers: {
          session_id: user.session_id,
        },
      });

      if (signal.aborted) throw new Error("Order request cancelled");
      const orders = parseOrderAnalyticsResponse(response.data);
      dispatch({ type: "SET_ORDERS", payload: orders, requestUser: user });
      showNotification({
        title: "Επιτυχής ανάκτηση δεδομένων",
        message: `Βρέθηκαν συνολικά ${orders.all.totalOrders} παραγγελίες`,
        color: "green",
        icon: <GoGraph />,
      });

      return response;
    },
    [user, dispatch],
  );

  const {
    refetch,
    isLoading: isInitialLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["orders", user?.session_id, user?.loginAt],
    queryFn: ({ signal }) => fetchOrders(signal),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!user?.session_id && !ordersState?.all,
  });

  const isLoading = isInitialLoading || isRefetching;

  const selectedYearOrders = useMemo(() => {
    if (!ordersState) return undefined;
    if (effectiveSelectedYear === "all") {
      return ordersState.all;
    }
    return ordersState.perYear.find(
      (year: PerYear) => year.year === effectiveSelectedYear,
    );
  }, [effectiveSelectedYear, ordersState]);

  return (
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full z-50">
          <Loading isLoading={isLoading} />
        </div>
      )}
      <DefaultLayout>
        <Container
          size="xl"
          className="
          p-4
         bg-white-200 rounded-md bg-clip-padding backdrop-filter backdrop-blur-md bg-opacity-20 shadow-xl
         firefox:bg-opacity-100 firefox:backdrop-filter-none firefox:bg-gray-600
      "
        >
          {isError ? (
            <Alert color="red" title="Η ανάκτηση παραγγελιών απέτυχε" mb="md">
              Τα δεδομένα δεν ενημερώθηκαν. Δοκιμάστε ξανά την ανανέωση.
            </Alert>
          ) : null}
          <Flex justify={"space-between"} align="flex-end">
            <Select
              label="Επιλογή Έτους"
              placeholder="Επιλογή Έτους"
              data={years}
              value={effectiveSelectedYear}
              onChange={(value) => {
                if (value) {
                  setSelectedYear(value);
                }
              }}
              clearable={false}
              style={{ zIndex: 401 }}
            />
            <TimeStampChecker refetch={refetch} />
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            <DashboardCard
              title="Πρώτη παραγγελία"
              value={dateFormat(selectedYearOrders?.firstOrder)}
              icon={<FaMedal size={40} />}
              color="rgba(234, 179, 8, 0.25)"
            />
            <DashboardCard
              title="Τελευταία παραγγελία"
              value={dateFormat(selectedYearOrders?.lastOrder)}
              icon={<CgRowLast size={40} />}
              color="rgba(59, 130, 246, 0.25)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
            <DashboardCard
              title="Συνολικές Παραγγελίες"
              value={selectedYearOrders?.totalOrders ?? NO_DATA}
              icon={<AiOutlineShoppingCart size={40} />}
              color="rgba(34, 197, 94, 0.25)"
            />
            <DashboardCard
              title="Συνολική Δαπάνη"
              value={formatAmount(selectedYearOrders?.totalPrice)}
              color="rgba(220, 38, 38, 0.25)"
              icon={<BsPiggyBank size={40} />}
            />
            <DashboardCard
              title="Μέσος Όρος / Παραγγελία"
              value={
                selectedYearOrders && selectedYearOrders.totalOrders > 0
                  ? formatAmount(
                      selectedYearOrders.totalPrice /
                        selectedYearOrders.totalOrders,
                    )
                  : NO_DATA
              }
              icon={<GoGraph size={40} />}
            />
            <DashboardCard
              title="Συνολικά φιλοδωρήματα"
              value={formatAmount(selectedYearOrders?.totalTips)}
              icon={<FaHandsHelping size={40} />}
              color="rgba(249, 115, 22, 0.25)"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 my-4">
            <DashboardCard
              title="Συνολικά Έξοδα Παράδοσης"
              value={formatAmount(selectedYearOrders?.deliveryCost)}
              icon={<FaTruck size={40} />}
              color="rgba(168, 85, 247, 0.25)"
            />
            <DashboardCard
              title="Έκπτωση από κουπόνια"
              value={formatAmount(selectedYearOrders?.couponAmount)}
              icon={<FaTicketAlt size={40} />}
              color="rgba(236, 72, 153, 0.25)"
            />
            <DashboardCard
              title="Μέση εκτίμηση χρόνου παράδοσης"
              value={timeFormat(selectedYearOrders?.averageDeliveryTime)}
              icon={<FaHourglassHalf size={40} />}
              color="rgba(99, 102, 241, 0.25)"
            />
            <DashboardCard
              title="Μοναδικά καταστήματα"
              value={selectedYearOrders?.uniqueRestaurants ?? NO_DATA}
              icon={<FaUtensils size={40} />}
              color="rgba(234, 179, 8, 0.25)"
            />
          </div>
          {ordersState && (
            <SpendingPanel
              timeline={ordersState.timeline}
              year={effectiveSelectedYear ?? "all"}
            />
          )}
          {selectedYearOrders && (
            <CostBreakdownPanel
              data={selectedYearOrders.costBreakdown}
              totalOrders={selectedYearOrders.totalOrders}
              totalPrice={selectedYearOrders.totalPrice}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            {selectedYearOrders?.restaurantWithMostMoneySpent && (
              <RestaurantCard
                data={selectedYearOrders?.restaurantWithMostMoneySpent}
              />
            )}

            {selectedYearOrders?.mostOrderedProduct && (
              <OrderCard data={selectedYearOrders?.mostOrderedProduct} />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            {selectedYearOrders?.phases && (
              <HourCard
                title="Ώρα με τις περισσότερες παραγγελίες"
                value={selectedYearOrders?.phases}
                icon={<FaClock size={40} />}
              />
            )}
            {selectedYearOrders?.cities && (
              <MapCard
                title="Πόλη με τις περισσότερες παραγγελίες"
                value={selectedYearOrders?.cities}
                color="rgba(13, 148, 136, 0.25)"
                icon={<FaCity size={40} />}
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            {selectedYearOrders?.months && (
              <WeekdayChart
                data={selectedYearOrders?.months}
                title="Παραγγελίες ανά μήνα"
                color="rgba(59, 130, 246, 0.25)"
              />
            )}
            {selectedYearOrders?.weekdays && (
              <WeekdayChart
                data={selectedYearOrders?.weekdays}
                title="Παραγγελίες ανά ημέρα"
                color="rgba(34, 197, 94, 0.25)"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 my-4">
            {selectedYearOrders?.platforms && (
              <PlatformAndPaymentChart
                data={selectedYearOrders?.platforms}
                title="Πλατφόρμες παραγγελιών"
                color="rgba(59, 130, 246, 0.25)"
              />
            )}
            {selectedYearOrders?.paymentMethods && (
              <PlatformAndPaymentChart
                data={selectedYearOrders?.paymentMethods}
                title="Τρόποι Πληρωμής"
                color="rgba(34, 197, 94, 0.25)"
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
