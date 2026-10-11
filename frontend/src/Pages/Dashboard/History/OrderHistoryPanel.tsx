import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NativeSelect,
  ScrollArea,
  Table,
  Text,
  Title,
} from "@mantine/core";
import type { OrderHistoryEntry } from "../../../types";
import { dateFormat, formatAmount } from "../../../utils/helpers";
import { parseOrderDate } from "../../../utils/orderDate";
import {
  getOrderCostBreakdown,
  paymentLabel,
  productLineAmount,
} from "../../../utils/ordersAnalytics";
import CostBreakdownPanel from "../CostBreakdown/CostBreakdownPanel";
import styles from "../AnalyticsPanel.module.css";

export default function OrderHistoryPanel({
  history,
}: {
  history: OrderHistoryEntry[];
}) {
  const [sort, setSort] = useState("newest"),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sorted = useMemo(
    () =>
      [...history].sort((a, b) => {
        if (sort === "high" || sort === "low")
          return (a.price - b.price) * (sort === "high" ? -1 : 1);
        const first = parseOrderDate(a.submissionDate),
          second = parseOrderDate(b.submissionDate);
        if (!first || !second) return first ? -1 : second ? 1 : 0;
        return (
          (first.getTime() - second.getTime()) * (sort === "newest" ? -1 : 1)
        );
      }),
    [history, sort],
  );
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)),
    effectivePage = Math.min(page, pages);
  const visible = sorted.slice(
    (effectivePage - 1) * pageSize,
    effectivePage * pageSize,
  );
  const selected = history.find((entry) => entry.id === selectedId);
  const selectedCost = selected ? getOrderCostBreakdown(selected) : null;
  return (
    <Card
      component="section"
      aria-label="Ιστορικό παραγγελιών"
      className={styles.panel}
      bg="var(--analytics-panel-bg)"
      withBorder
      p="lg"
      my="md"
    >
      <Group justify="space-between">
        <Title order={2} size="h3">
          Ιστορικό παραγγελιών
        </Title>
        <Badge>
          {history.length} {history.length === 1 ? "παραγγελία" : "παραγγελίες"}
        </Badge>
      </Group>
      <Group my="md">
        <NativeSelect
          label="Ταξινόμηση παραγγελιών"
          value={sort}
          onChange={(event) => {
            setSort(event.currentTarget.value);
            setPage(1);
          }}
          data={[
            { value: "newest", label: "Νεότερες πρώτα" },
            { value: "oldest", label: "Παλιότερες πρώτα" },
            { value: "high", label: "Μεγαλύτερο ποσό πρώτα" },
            { value: "low", label: "Μικρότερο ποσό πρώτα" },
          ]}
        />
        <NativeSelect
          label="Παραγγελίες ανά σελίδα"
          value={String(pageSize)}
          onChange={(event) => {
            setPageSize(Number(event.currentTarget.value));
            setPage(1);
          }}
          data={["20", "50", "100"]}
        />
      </Group>
      {history.length > 0 ? (
        <>
          <ScrollArea>
            <Table miw={700} striped withTableBorder>
              <Table.Caption>Οι παραγγελίες σου</Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  {[
                    "Ημερομηνία (Αθήνα)",
                    "Κατάστημα",
                    "Ποσό",
                    "Πληρωμή",
                    "Λεπτομέρειες",
                  ].map((label) => (
                    <Table.Th key={label}>{label}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visible.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>
                      {entry.submissionDate
                        ? dateFormat(entry.submissionDate)
                        : "Χωρίς ημερομηνία"}
                    </Table.Td>
                    <Table.Td>
                      {entry.restaurant.name || "Άγνωστο κατάστημα"}
                    </Table.Td>
                    <Table.Td>{formatAmount(entry.price)}</Table.Td>
                    <Table.Td>{paymentLabel(entry.payment)}</Table.Td>
                    <Table.Td>
                      <Button
                        variant="light"
                        size="xs"
                        aria-label={`Λεπτομέρειες παραγγελίας ${entry.restaurant.name || "Άγνωστο κατάστημα"}, ${dateFormat(entry.submissionDate)}`}
                        onClick={() => setSelectedId(entry.id)}
                      >
                        Προβολή
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          <Group justify="space-between" mt="md">
            <Button
              variant="default"
              disabled={effectivePage <= 1}
              onClick={() => setPage(effectivePage - 1)}
            >
              Προηγούμενη σελίδα
            </Button>
            <Text size="sm" aria-live="polite">
              Σελίδα {effectivePage}/{pages} ·{" "}
              {(effectivePage - 1) * pageSize + 1}–
              {Math.min(effectivePage * pageSize, history.length)} από{" "}
              {history.length}
            </Text>
            <Button
              variant="default"
              disabled={effectivePage >= pages}
              onClick={() => setPage(effectivePage + 1)}
            >
              Επόμενη σελίδα
            </Button>
          </Group>
        </>
      ) : (
        <Text mt="md">Δεν βρέθηκαν παραγγελίες με αυτή την επιλογή.</Text>
      )}
      <Modal
        opened={!!selected}
        onClose={() => setSelectedId(null)}
        title="Λεπτομέρειες παραγγελίας"
        size="xl"
        zIndex={1000}
        classNames={{ content: styles.details }}
        closeButtonProps={{ "aria-label": "Κλείσιμο λεπτομερειών" }}
        centered
      >
        {selected && selectedCost ? (
          <>
            <Title order={3} size="h4">
              {selected.restaurant.name || "Άγνωστο κατάστημα"}
            </Title>
            <Text>{dateFormat(selected.submissionDate)}</Text>
            <Text fw={700}>
              Σύνολο παραγγελίας: {formatAmount(selected.price)}
            </Text>
            <Text size="sm">Πληρωμή: {paymentLabel(selected.payment)}</Text>
            <Text size="sm" c="dimmed">
              Κατάσταση στο efood: {selected.status || "Άγνωστη"}. Η ένδειξη δεν
              επιβεβαιώνει την παράδοση ή τυχόν επιστροφή χρημάτων.
            </Text>
            <ScrollArea>
              <Table miw={400} my="md">
                <Table.Caption>Τι περιλάμβανε η παραγγελία</Table.Caption>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Είδος</Table.Th>
                    <Table.Th>Ποσότητα</Table.Th>
                    <Table.Th>Ποσό</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selected.products.map((product, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>{product.name || "Χωρίς όνομα"}</Table.Td>
                      <Table.Td>
                        {product.quantity.toLocaleString("el-GR")}
                      </Table.Td>
                      <Table.Td>
                        {formatAmount(
                          productLineAmount(
                            product.quantity,
                            product.unitPrice,
                          ),
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            <CostBreakdownPanel
              data={selectedCost}
              totalOrders={1}
              totalPrice={selected.price}
            />
          </>
        ) : null}
      </Modal>
    </Card>
  );
}
