import { Card, Text, Badge, Group, Flex } from "@mantine/core";

export default function DashboardCard({
  title,
  value,
  icon,
  color,
  hover = true,
}: {
  title: string;
  value: string | number | React.ReactNode | undefined;
  icon?: React.ReactNode;
  color?: string;
  hover?: boolean;
}) {
  return (
    <Card
      shadow="sm"
      className={`h-full w-full  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm  bg-opacity-25 transition duration-300 ease-in-out transform shadow-xl cursor-auto ${
        color ? color : "bg-sky-400"
      } ${hover ? "hover:scale-95" : ""} `}
    >
      <Group position="center" h="100%">
        <Flex justify="space-between" align="center" className="w-full">
          <Flex direction={"column"} sx={{ flex: 1 }} className="w-full">
            <Text size="xl" weight={800} ta="left">
              {value}
            </Text>
            <Text size="sm" weight={500} ta="left" className="mt-1">
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
