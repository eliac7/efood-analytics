import { Card, Text, Group, Flex } from "@mantine/core";
import { Phases } from "../../../types/app_types";

export default function MapCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: { [key: string]: number };
  icon?: React.ReactNode;
  hover?: boolean;
  color?: string;
}) {
  return (
    <Card
      shadow="sm"
      className={`h-full min-h-[10rem] w-full  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm  bg-opacity-25 transition duration-300 ease-in-out transform shadow-xl cursor-auto ${
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
              Η πολή στην οποία πραγματοποιήσατε τις περισσότερες παραγγελίες
              είναι η πολή <b>"{Object.keys(value)[0]}"</b> με{" "}
              <b>{Object.values(value)[0]}</b> παραγγελίες.
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
