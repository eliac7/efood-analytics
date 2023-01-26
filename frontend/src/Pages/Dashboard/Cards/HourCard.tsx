import { Card, Text, Badge, Group, Flex } from "@mantine/core";
import { Phases } from "../../../types/app_types";

export default function HourCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: Phases;
  icon?: React.ReactNode;
  hover?: boolean;
}) {
  let time = Object.keys(value)[0];
  const orders = Object.values(value)[0];
  let color = "";
  let hour = "";

  switch (time) {
    case "morning":
      time = "πρωί";
      hour = "06:00-12:00";
      color = "bg-yellow-500";

      break;
    case "noon":
      time = "μεσημέρι";
      hour = "12:00-17:00";
      color = "bg-orange-500";
      break;
    case "afternoon":
      time = "απόγευμα";
      hour = "17:00-20:00";
      color = "bg-orange-500";
      break;
    case "night":
      time = "νύχτα";
      hour = "20:00-06:00";
      color = "bg-indigo-500";
      break;
    default:
      time = "πρωί";
      hour = "06:00-12:00";
      color = "bg-yellow-500";
  }

  return (
    <Card
      shadow="sm"
      className={`h-full w-full  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm  bg-opacity-25 transition duration-300 ease-in-out transform shadow-xl cursor-auto ${
        color ? color : "bg-sky-400"
      }`}
    >
      <Group position="center" h="100%">
        <Flex
          justify="space-between"
          align="center"
          className="w-full h-full"
          gap={20}
        >
          <Flex direction={"column"} className="w-full h-full">
            <Text size="xl" weight={400} ta="left" className="flex-1">
              Τις περισσότερες φορές, λιγουρεύτηκες{" "}
              {time === "νύχτα" ? "τη " : "το "}
              <b>
                {time} ({hour})
              </b>{" "}
              με <b>{orders}</b> παραγγελίες συνολικά
            </Text>
            <Text
              size="sm"
              weight={500}
              ta="left"
              className="flex-1 flex items-end"
            >
              {title}
            </Text>
          </Flex>
          {icon && (
            <Flex>
              <Flex align="center" justify="center">
                {icon}
              </Flex>
            </Flex>
          )}
        </Flex>
      </Group>
    </Card>
  );
}
