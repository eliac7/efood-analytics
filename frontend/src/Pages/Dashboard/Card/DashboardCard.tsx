import { Card, Text, Badge, Group, Flex } from "@mantine/core";

export default function DashboardCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number | undefined;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <Card
      shadow="sm"
      className={`h-full w-full  rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm  bg-opacity-25 hover:scale-95 transition duration-300 ease-in-out transform shadow-xl cursor-auto ${
        color ? color : "bg-sky-400"
      }`}
    >
      <Group position="center">
        <Flex justify="space-between" align="center" className="w-full">
          <Flex direction={"column"}>
            <Text size="xl" weight={800} ta="left">
              {value}
            </Text>
            <Text size="sm" weight={600} ta="left" className="mt-1">
              {title}
            </Text>
          </Flex>
          <Flex>
            {icon && (
              <Flex align="center" justify="center">
                {icon}
              </Flex>
            )}
          </Flex>
        </Flex>
      </Group>
    </Card>
  );
}
