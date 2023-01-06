import { Card, Image, Text, Badge, Button, Group } from "@mantine/core";

function DashboardCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <Group position="apart">{children}</Group>
    </Card>
  );
}

export default DashboardCard;
