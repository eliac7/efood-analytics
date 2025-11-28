import { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { PaymentMethods, Platforms } from "../../../types/app_types";
import DashboardCard from "../Cards/DashboardCard";
import { useMantineColorScheme } from "@mantine/core";

function PlatformAndPaymentChart({
  data,
  title,
  color,
}: {
  data: Platforms | PaymentMethods;
  title: string;
  color: string;
}) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [options, setOptions] = useState({
    options: {
      labels: Object.keys(data).map((key) => key),
      tooltip: {
        enabled: true,
      },
      chart: {
        foreColor: isDark ? "#fff" : "#2E4053",
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },

    series: Object.values(data),
  });

  useEffect(() => {
    setOptions({
      options: {
        ...options.options,
        labels: Object.keys(data).map(
          (key) => key.charAt(0).toUpperCase() + key.slice(1)
        ),
        chart: {
          foreColor: isDark ? "#fff" : "#2E4053",
        },
      },

      series: Object.values(data),
    });
  }, [data, isDark]);

  return (
    <DashboardCard
      title={title}
      color={color}
      hover={false}
      value={
        <ReactApexChart
          type="donut"
          options={options.options}
          series={options.series}
          height={350}
        />
      }
    />
  );
}

export default PlatformAndPaymentChart;
