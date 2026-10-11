import { Alert, Badge, Card, Group, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import type { CostAmount, CostBreakdown, CostComponentKey } from "../../../types";
import { CHARGE_COLORS, CHARGE_KEYS, COST_LABELS } from "../../../utils/costs";
import { formatAmount, NO_DATA } from "../../../utils/helpers";

function AmountValue({ value, totalOrders }: { value: CostAmount; totalOrders: number }) {
  return <>
    <Text fw={600}>{value.amount === null && value.coveredOrders > 0 ? "Πλήρες σύνολο μη διαθέσιμο" : formatAmount(value.amount)}</Text>
    {value.amount === null && value.coveredOrders > 0 && <Text size="xs" c="dimmed">
      Διαθέσιμο μέρος: {formatAmount(value.knownAmount)} σε {value.coveredOrders}/{totalOrders} παραγγελίες
    </Text>}
  </>;
}

export default function CostBreakdownPanel({ data, totalOrders, totalPrice }: {
  data: CostBreakdown; totalOrders: number; totalPrice: number;
}) {
  const { components, additionalCharges, reconciliation } = data;
  const percentage = additionalCharges.amount !== null && totalPrice > 0
    ? new Intl.NumberFormat("el-GR", { style: "percent", maximumFractionDigits: 1 }).format(additionalCharges.amount / totalPrice)
    : NO_DATA;
  const chargeRows = CHARGE_KEYS.filter((key) => components[key].amount !== 0 || components[key].knownAmount !== 0);
  const rows: CostComponentKey[] = ["productLines", ...chargeRows, "coupon", "joker"];
  const drawable = additionalCharges.amount !== null && additionalCharges.amount > 0;
  const chartDescription = CHARGE_KEYS.filter((key) => (components[key].amount ?? 0) > 0)
    .map((key) => `${COST_LABELS[key]}: ${formatAmount(components[key].amount)}`).join(", ");

  return <Card component="section" aria-label="Ανάλυση κόστους" shadow="sm" radius="md" p="lg" my="md"
    style={{ backgroundColor: "rgba(14, 165, 233, 0.12)" }}>
    <Stack gap="md">
      <div>
        <Group justify="space-between" gap="xs">
          <Title order={2} size="h3">Ανάλυση κόστους</Title>
          <Badge variant="light">{totalOrders} {totalOrders === 1 ? "παραγγελία" : "παραγγελίες"}</Badge>
        </Group>
        <Text size="sm" c="dimmed" mt="xs">Τα παρακάτω ποσά περιλαμβάνονται ήδη στη συνολική δαπάνη της επιλεγμένης περιόδου.</Text>
      </div>
      {totalOrders === 0 ? <Text>{NO_DATA}</Text> : <>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <div><Text size="sm" c="dimmed">Αναφερόμενες πρόσθετες χρεώσεις</Text>
            <AmountValue value={additionalCharges} totalOrders={totalOrders} /></div>
          <div><Text size="sm" c="dimmed">Μερίδιο στη συνολική δαπάνη</Text><Text fw={600}>{percentage}</Text></div>
          <div><Text size="sm" c="dimmed">Ανάλυση που συμφωνεί με το σύνολο</Text>
            <Text fw={600}>{reconciliation.matchedOrders}/{totalOrders} παραγγελίες</Text>
            <Text size="xs" c="dimmed">Ανοχή στρογγυλοποίησης έως 0,01 € ανά παραγγελία</Text></div>
        </SimpleGrid>
        {drawable && <div>
          <Text size="sm" mb="xs">Κατανομή πρόσθετων χρεώσεων</Text>
          <div role="img" aria-label={`Κατανομή πρόσθετων χρεώσεων: ${chartDescription}`}
            style={{ display: "flex", height: 18, borderRadius: 9, overflow: "hidden" }}>
            {CHARGE_KEYS.map((key) => (components[key].amount ?? 0) > 0 && <div key={key} aria-hidden="true"
              style={{ width: `${components[key].amount! / additionalCharges.amount! * 100}%`, backgroundColor: CHARGE_COLORS[key] }} />)}
          </div>
        </div>}
        <Table layout="fixed" verticalSpacing="sm">
          <Table.Thead><Table.Tr><Table.Th style={{ width: "42%" }}>Κατηγορία</Table.Th>
            <Table.Th style={{ width: "38%" }}>Ποσό</Table.Th><Table.Th style={{ width: "20%" }}>Κάλυψη</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>{rows.map((key) => <Table.Tr key={key}>
            <Table.Td><Group gap="xs" wrap="nowrap">
              {CHARGE_COLORS[key] && <span aria-hidden="true" style={{ width: 9, height: 9, flexShrink: 0, borderRadius: "50%", backgroundColor: CHARGE_COLORS[key] }} />}
              <Text size="sm">{COST_LABELS[key]}{key === "coupon" || key === "joker" ? " (−)" : ""}</Text></Group></Table.Td>
            <Table.Td><AmountValue value={components[key]} totalOrders={totalOrders} /></Table.Td>
            <Table.Td><Text size="sm">{components[key].coveredOrders}/{totalOrders}</Text></Table.Td>
          </Table.Tr>)}</Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed">Μηδενικές χρεώσεις με πλήρη κάλυψη αποκρύπτονται. Οι προσαρμογές στις γραμμές προϊόντων έχουν ήδη συνυπολογιστεί στο ποσό τους. Δεν αφαιρούνται ξανά εκπτώσεις efood pro.</Text>
        {(data.includedTaxes.knownAmount > 0 || data.includedTaxes.amount === null) && <Text size="sm" c="dimmed">
          Φόροι μέσα στις τιμές προϊόντων: {formatAmount(data.includedTaxes.amount)}
          {data.includedTaxes.amount === null && data.includedTaxes.coveredOrders > 0
            ? ` (διαθέσιμο μέρος ${formatAmount(data.includedTaxes.knownAmount)}, κάλυψη ${data.includedTaxes.coveredOrders}/${totalOrders})` : ""}.
          {" "}Δεν προστίθενται ξανά στις χρεώσεις.
        </Text>}
        {reconciliation.mismatchedOrders > 0 && <Alert color="orange" title="Η επιμέρους ανάλυση έχει αποκλίσεις">
          Σε {reconciliation.mismatchedOrders}/{totalOrders} παραγγελίες τα στοιχεία κόστους δεν εξηγούν πλήρως το συνολικό ποσό.
          {" "}Άθροισμα απόλυτων διαφορών: {formatAmount(reconciliation.absoluteDifference)}.
          {" "}Το ποσό αυτό δεν είναι επιπλέον χρέωση ή επιβεβαιωμένη έκπτωση. Η συνολική δαπάνη παραμένει το ποσό που αναφέρει το efood.
        </Alert>}
        {reconciliation.unavailableOrders > 0 && <Alert color="blue" title="Μερική κάλυψη στοιχείων κόστους">
          Σε {reconciliation.unavailableOrders}/{totalOrders} παραγγελίες λείπουν απαραίτητα στοιχεία ή δεν μπορεί να διακριθεί αν μια έκπτωση έχει ήδη εφαρμοστεί.
          {" "}Τα διαθέσιμα ποσά επισημαίνονται ως μερικά και δεν θεωρούνται πλήρη σύνολα.
        </Alert>}
      </>}
    </Stack>
  </Card>;
}
