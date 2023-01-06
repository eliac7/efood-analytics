import { useState, useEffect } from "react";
import DefaultLayout from "../../Layouts/DefaultLayout/DefaultLayout";
import { Container, Select } from "@mantine/core";
import Loading from "../../Components/Loading/Loading";

function Dashboard() {
  type years = {
    label: string;
    value: string;
  };

  const [years, setYears] = useState<years[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  // useEffect(() => {
  //   if (orders) {
  //     console.log(orders);
  //     const years = orders.orders.perYear.map((year) => {
  //       return { label: year.year, value: year.year };
  //     });
  //     years.unshift({ label: "Όλα τα έτη", value: "all" });
  //     setYears(years);
  //     setSelectedYear(years[0].value);
  //   }
  // }, [orders]);

  return (
    <>
      {/* <Loading isLoading={isLoadingOrders} /> */}
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
