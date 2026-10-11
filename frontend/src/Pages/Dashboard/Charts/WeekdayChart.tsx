import { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { useMantineColorScheme } from "@mantine/core";
import DashboardCard from "../Cards/DashboardCard";
import { highestCount, NO_DATA } from "../../../utils/helpers";

function WeekdayChart({
  data,
  title,
  color,
}: {
  data: { [key: string]: number };
  title: string;
  color: string;
}) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const options = useMemo(
    () => ({
      options: {
        xaxis: { categories: Object.keys(data) },
        dataLabels: {
          enabled: true,
          style: {
            colors: ["#2E4053"],
          },
        },
        tooltip: {
          enabled: false,
        },
        chart: {
          toolbar: {
            show: false,
          },
          foreColor: isDark ? "#fff" : "#2E4053",
        },
      },
      series: [
        {
          name: "Παραγγελίες",
          data: Object.keys(data).map((key) => {
            return {
              x: key,
              y: data[key],
            };
          }),
        },
      ],
    }),
    [data, isDark],
  );

  return (
    <DashboardCard
      title={title}
      hover={false}
      color={color}
      value={
        highestCount(data) ? (
          <ReactApexChart
            type="heatmap"
            options={options.options}
            series={options.series}
            height={150}
          />
        ) : (
          NO_DATA
        )
      }
    />
  );
}

export default WeekdayChart;
