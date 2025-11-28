import { Card, Text, Group, Flex } from "@mantine/core";

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
      style={{
        backgroundColor: color || "rgba(14, 165, 233, 0.25)",
      }}
      className={`h-full w-full rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm transition duration-300 ease-in-out transform shadow-xl cursor-auto ${hover ? "hover:scale-95" : ""}`}
    >
      <Group justify="center" h="100%">
        <Flex
          justify="space-between"
          align="center"
          className="w-full"
          gap={20}
        >
          <Flex direction={"column"} style={{ flex: 1 }} className="w-full">
            <Text size="xl" fw={800} ta="left">
              {value}
            </Text>
            <Text size="sm" fw={500} ta="left" className="mt-1">
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
