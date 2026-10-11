import { useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  NativeSelect,
  ScrollArea,
  Table,
  Text,
  Title,
} from "@mantine/core";
import type { OrderHistoryEntry, Restaurant } from "../../../types";
import { formatAmount } from "../../../utils/helpers";
import {
  buildStoreRows,
  formatStoreShare,
  hasStoreLocation,
  sortStores,
  type StoreMetric,
  type StoreSort,
} from "../../../utils/storeAnalytics";
import Map from "../Map/Map";
import styles from "../AnalyticsPanel.module.css";

export default function StoresPanel({
  restaurants,
  history,
  totalPrice,
  onShowOrders,
}: {
  restaurants: Restaurant[];
  history: OrderHistoryEntry[];
  totalPrice: number;
  onShowOrders: (id: string) => void;
}) {
  const [sort, setSort] = useState<StoreSort>("amount");
  const [limit, setLimit] = useState("5");
  const [metric, setMetric] = useState<StoreMetric>("amount");
  const [selection, setSelection] = useState<{
    id: string | null;
    request: number;
  }>({ id: null, request: 0 });
  const mapHeadingRef = useRef<HTMLHeadingElement>(null);
  const rows = useMemo(
    () => buildStoreRows(restaurants, history, totalPrice),
    [restaurants, history, totalPrice],
  );
  const sorted = useMemo(() => sortStores(rows, sort), [rows, sort]);
  const visible = limit === "all" ? sorted : sorted.slice(0, Number(limit));
  const located = rows.filter(hasStoreLocation);
  const selectStore = (id: string) => {
    setSelection((previous) => ({ id, request: previous.request + 1 }));
    mapHeadingRef.current?.scrollIntoView?.({
      block: "start",
      behavior: "smooth",
    });
    mapHeadingRef.current?.focus({ preventScroll: true });
  };
  return (
    <Card
      component="section"
      aria-label="Τα καταστήματά σου"
      className={styles.panel}
      bg="var(--analytics-panel-bg)"
      withBorder
      p="lg"
      my="md"
    >
      <Group justify="space-between">
        <Title order={2} size="h3">
          Τα καταστήματά σου
        </Title>
        <Badge>
          {rows.length} {rows.length === 1 ? "κατάστημα" : "καταστήματα"}
        </Badge>
      </Group>
      <Text size="sm" c="dimmed" mt="xs">
        Πού ξοδεύεις περισσότερο και από πού παραγγέλνεις συχνότερα, με τα
        φίλτρα που έχεις επιλέξει.
      </Text>
      {rows.length ? (
        <>
          <Group my="md">
            <NativeSelect
              label="Κατάταξη καταστημάτων"
              value={sort}
              onChange={(event) =>
                setSort(event.currentTarget.value as StoreSort)
              }
              data={[
                { value: "amount", label: "Περισσότερα έξοδα" },
                { value: "orders", label: "Περισσότερες παραγγελίες" },
                { value: "average", label: "Μεγαλύτερο μέσο ποσό" },
              ]}
            />
            <NativeSelect
              label="Εμφάνιση καταστημάτων"
              value={limit}
              onChange={(event) => setLimit(event.currentTarget.value)}
              data={[
                { value: "5", label: "Top 5" },
                { value: "10", label: "Top 10" },
                { value: "all", label: "Όλα" },
              ]}
            />
          </Group>
          <ScrollArea>
            <Table miw={750} striped withTableBorder>
              <Table.Caption>
                Κατάταξη για την επιλεγμένη περίοδο · {visible.length} από{" "}
                {rows.length} καταστήματα
              </Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  {[
                    "Θέση",
                    "Κατάστημα",
                    "Ποσό",
                    "Παραγγελίες",
                    "Μέσο ποσό",
                    "Μερίδιο εξόδων",
                    "Προβολή",
                  ].map((label) => (
                    <Table.Th key={label}>{label}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visible.map((store, index) => (
                  <Table.Tr
                    key={String(store.id)}
                    data-selected={
                      selection.id === String(store.id) || undefined
                    }
                  >
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>
                      <Group wrap="nowrap" gap="xs">
                        <Avatar src={store.logo} alt="" radius="xl" size="sm">
                          {store.name?.slice(0, 1) || "?"}
                        </Avatar>
                        <Text size="sm">
                          {store.name || "Άγνωστο κατάστημα"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{formatAmount(store.totalPrice)}</Table.Td>
                    <Table.Td>{store.orders}</Table.Td>
                    <Table.Td>{formatAmount(store.average)}</Table.Td>
                    <Table.Td>{formatStoreShare(store.share)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        {hasStoreLocation(store) ? (
                          <Button
                            size="xs"
                            variant="default"
                            aria-label={`Στον χάρτη: ${store.name || "Άγνωστο κατάστημα"}`}
                            aria-pressed={selection.id === String(store.id)}
                            onClick={() => selectStore(String(store.id))}
                          >
                            Στον χάρτη
                          </Button>
                        ) : (
                          <Text size="xs" c="dimmed">
                            Χωρίς θέση
                          </Text>
                        )}
                        <Button
                          size="xs"
                          variant="light"
                          aria-label={`Παραγγελίες: ${store.name || "Άγνωστο κατάστημα"}`}
                          onClick={() => onShowOrders(String(store.id))}
                        >
                          Παραγγελίες
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          <Title ref={mapHeadingRef} tabIndex={-1} order={3} size="h4" mt="lg">
            Τα καταστήματα που παραγγέλνεις
          </Title>
          <Text size="sm" c="dimmed" mt="xs" aria-live="polite">
            Στον χάρτη: {located.length} από {rows.length} καταστήματα.{" "}
            {rows.length - located.length > 0
              ? `${rows.length - located.length} χωρίς διαθέσιμη θέση· παραμένουν στον πίνακα και στα συνολικά ποσά.`
              : ""}
          </Text>
          {located.length ? (
            <>
              <Group mt="md" align="end" justify="space-between">
                <NativeSelect
                  label="Προβολή χάρτη"
                  value={metric}
                  onChange={(event) =>
                    setMetric(event.currentTarget.value as StoreMetric)
                  }
                  data={[
                    { value: "amount", label: "Ποσό" },
                    { value: "orders", label: "Παραγγελίες" },
                  ]}
                />
                <Button
                  variant="default"
                  onClick={() =>
                    setSelection((previous) => ({
                      id: null,
                      request: previous.request + 1,
                    }))
                  }
                >
                  Όλα τα καταστήματα
                </Button>
              </Group>
              <Text size="xs" c="dimmed" my="sm">
                Μεγαλύτερος κύκλος ={" "}
                {metric === "amount"
                  ? "μεγαλύτερο ποσό"
                  : "περισσότερες παραγγελίες"}
                . Ο χάρτης δείχνει όλα τα καταστήματα των φίλτρων, ανεξάρτητα
                από το Top 5/10. Κοντινά σημεία μπαίνουν σε ομάδες· πάτησε μια
                ομάδα για να δεις τα καταστήματά της. Στην ίδια ακριβώς θέση, τα
                καταστήματα μοιράζονται ένα popup.
              </Text>
            </>
          ) : (
            <Text mt="sm">
              Δεν έχουμε διαθέσιμες θέσεις για αυτά τα καταστήματα.
            </Text>
          )}
        </>
      ) : (
        <Text mt="md">Δεν βρέθηκαν καταστήματα με αυτή την επιλογή.</Text>
      )}
      <Map
        restaurants={rows}
        metric={metric}
        selectedId={selection.id}
        focusRequest={selection.request}
        onSelect={(id) =>
          setSelection((previous) => ({ id, request: previous.request + 1 }))
        }
        onShowOrders={onShowOrders}
      />
    </Card>
  );
}
