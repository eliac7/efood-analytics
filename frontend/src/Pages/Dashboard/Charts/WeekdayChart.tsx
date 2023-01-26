import { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import DashboardCard from "../Cards/DashboardCard";

function WeekdayChart({
  data,
  title,
}: {
  data: { [key: string]: number };
  title: string;
}) {
  const [options, setOptions] = useState({
    options: {
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
        foreColor: "#fff",
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
  });

  useEffect(() => {
    setOptions({
      options: {
        ...options.options,
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
    });
  }, [data]);

  return (
    <DashboardCard
      title={title}
      hover={false}
      color="bg-emerald-800"
      value={
        <ReactApexChart
          type="heatmap"
          options={options.options}
          series={options.series}
          height={150}
        />
      }
    />
  );
}

export default WeekdayChart;
