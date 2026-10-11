import {
  Alert,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import type {
  CostAmount,
  CostBreakdown,
  CostComponentKey,
} from "../../../types";
import { CHARGE_COLORS, CHARGE_KEYS, COST_LABELS } from "../../../utils/costs";
import { formatAmount, NO_DATA } from "../../../utils/helpers";
import styles from "../AnalyticsPanel.module.css";

function AmountValue({
  value,
  totalOrders,
}: {
  value: CostAmount;
  totalOrders: number;
}) {
  return (
    <>
      <Text fw={600}>
        {value.amount === null && value.coveredOrders > 0
          ? "Λείπουν ποσά"
          : formatAmount(value.amount)}
      </Text>
      {value.amount === null && value.coveredOrders > 0 && (
        <Text size="xs" c="dimmed">
          Γνωστό ποσό: {formatAmount(value.knownAmount)} σε{" "}
          {value.coveredOrders}/{totalOrders} παραγγελίες
        </Text>
      )}
    </>
  );
}

export default function CostBreakdownPanel({
  data,
  totalOrders,
  totalPrice,
}: {
  data: CostBreakdown;
  totalOrders: number;
  totalPrice: number;
}) {
  const { components, additionalCharges, reconciliation } = data;
  const percentage =
    additionalCharges.amount !== null && totalPrice > 0
      ? new Intl.NumberFormat("el-GR", {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(additionalCharges.amount / totalPrice)
      : NO_DATA;
  const chargeRows = CHARGE_KEYS.filter(
    (key) => components[key].amount !== 0 || components[key].knownAmount !== 0,
  );
  const rows: CostComponentKey[] = [
    "productLines",
    ...chargeRows,
    "coupon",
    "joker",
  ];
  const drawable =
    additionalCharges.amount !== null && additionalCharges.amount > 0;
  const chartDescription = CHARGE_KEYS.filter(
    (key) => (components[key].amount ?? 0) > 0,
  )
    .map(
      (key) => `${COST_LABELS[key]}: ${formatAmount(components[key].amount)}`,
    )
    .join(", ");

  return (
    <Card
      component="section"
      aria-label="Ανάλυση κόστους"
      shadow="sm"
      radius="md"
      p="lg"
      my="md"
      className={styles.panel}
      bg="var(--analytics-panel-bg)"
    >
      <Stack gap="md">
        <div>
          <Group justify="space-between" gap="xs">
            <Title order={2} size="h3">
              Ανάλυση κόστους
            </Title>
            <Badge variant="light">
              {totalOrders} {totalOrders === 1 ? "παραγγελία" : "παραγγελίες"}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed" mt="xs">
            Πού πήγαν τα χρήματά σου. Όλα τα ποσά μετρούν ήδη στο σύνολο.
          </Text>
        </div>
        {totalOrders === 0 ? (
          <Text>{NO_DATA}</Text>
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <div>
                <Text size="sm" c="dimmed">
                  Έξτρα χρεώσεις
                </Text>
                <AmountValue
                  value={additionalCharges}
                  totalOrders={totalOrders}
                />
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Ποσοστό των εξόδων σου
                </Text>
                <Text fw={600}>{percentage}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">
                  Παραγγελίες που συμφωνούν στο ποσό
                </Text>
                <Text fw={600}>
                  {reconciliation.matchedOrders}/{totalOrders}{" "}
                  {totalOrders === 1 ? "παραγγελία" : "παραγγελίες"}
                </Text>
                <Text size="xs" c="dimmed">
                  Με περιθώριο 0,01 € για στρογγυλοποιήσεις
                </Text>
              </div>
            </SimpleGrid>
            {drawable && (
              <div>
                <Text size="sm" mb="xs">
                  Οι έξτρα χρεώσεις αναλυτικά
                </Text>
                <div
                  role="img"
                  aria-label={`Κατανομή πρόσθετων χρεώσεων: ${chartDescription}`}
                  style={{
                    display: "flex",
                    height: 18,
                    borderRadius: 9,
                    overflow: "hidden",
                  }}
                >
                  {CHARGE_KEYS.map(
                    (key) =>
                      (components[key].amount ?? 0) > 0 && (
                        <div
                          key={key}
                          aria-hidden="true"
                          style={{
                            width: `${(components[key].amount! / additionalCharges.amount!) * 100}%`,
                            backgroundColor: CHARGE_COLORS[key],
                          }}
                        />
                      ),
                  )}
                </div>
              </div>
            )}
            <Table layout="fixed" verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: "42%" }}>Κατηγορία</Table.Th>
                  <Table.Th style={{ width: "38%" }}>Ποσό</Table.Th>
                  <Table.Th
                    style={{ width: "20%" }}
                    title="Παραγγελίες με διαθέσιμο ποσό"
                  >
                    Στοιχεία για
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((key) => (
                  <Table.Tr key={key}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        {CHARGE_COLORS[key] && (
                          <span
                            aria-hidden="true"
                            style={{
                              width: 9,
                              height: 9,
                              flexShrink: 0,
                              borderRadius: "50%",
                              backgroundColor: CHARGE_COLORS[key],
                            }}
                          />
                        )}
                        <Text size="sm">
                          {COST_LABELS[key]}
                          {key === "coupon" || key === "joker" ? " (−)" : ""}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <AmountValue
                        value={components[key]}
                        totalOrders={totalOrders}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {components[key].coveredOrders}/{totalOrders}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Text size="xs" c="dimmed">
              Οι μηδενικές χρεώσεις δεν εμφανίζονται. Οι εκπτώσεις μέσα στις
              τιμές, μαζί με το efood pro, έχουν ήδη αφαιρεθεί.
            </Text>
            {(data.includedTaxes.knownAmount > 0 ||
              data.includedTaxes.amount === null) && (
              <Text size="sm" c="dimmed">
                Φόροι μέσα στις τιμές προϊόντων:{" "}
                {formatAmount(data.includedTaxes.amount)}
                {data.includedTaxes.amount === null &&
                data.includedTaxes.coveredOrders > 0
                  ? ` (γνωστό ποσό ${formatAmount(data.includedTaxes.knownAmount)} σε ${data.includedTaxes.coveredOrders}/${totalOrders} παραγγελίες)`
                  : ""}
                . Περιλαμβάνονται ήδη, δεν είναι έξτρα χρέωση.
              </Text>
            )}
            {reconciliation.mismatchedOrders > 0 && (
              <Alert color="orange" title="Κάποια ποσά δεν συμφωνούν">
                Σε {reconciliation.mismatchedOrders} από τις {totalOrders}{" "}
                παραγγελίες, τα επιμέρους ποσά διαφέρουν από το σύνολο του
                efood. Οι διαφορές φτάνουν συνολικά τα{" "}
                {formatAmount(reconciliation.absoluteDifference)}. Δεν είναι
                έξτρα χρέωση ή επιβεβαιωμένη έκπτωση. Στα έξοδά σου κρατάμε το
                σύνολο του efood.
              </Alert>
            )}
            {reconciliation.unavailableOrders > 0 && (
              <Alert color="blue" title="Λείπουν στοιχεία κόστους">
                Για {reconciliation.unavailableOrders} από τις {totalOrders}{" "}
                παραγγελίες, λείπουν ποσά ή δεν είναι σαφές πώς μπήκε μια
                έκπτωση. Όπου λείπουν στοιχεία, βλέπεις μόνο το γνωστό ποσό.
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
