import { useRef, useState } from "react";
import {
  Alert,
  Accordion,
  Badge,
  Button,
  Card,
  Group,
  NativeSelect,
  SimpleGrid,
  Text,
  TextInput,
} from "@mantine/core";
import type { OrderHistoryEntry } from "../../../types";
import {
  EMPTY_ORDER_FILTERS,
  hasOrderFilters,
  paymentLabel,
  validateOrderFilters,
  type OrderFilters,
} from "../../../utils/ordersAnalytics";
import styles from "../AnalyticsPanel.module.css";
import { formatAmount } from "../../../utils/helpers";

export default function OrderFiltersPanel({
  history,
  appliedFilters,
  matchingCount,
  onApply,
}: {
  history: OrderHistoryEntry[];
  appliedFilters: OrderFilters;
  matchingCount: number;
  onApply: (filters: OrderFilters) => void;
}) {
  const [form, setForm] = useState(() => ({
    applied: appliedFilters,
    draft: { ...appliedFilters },
    error: null as string | null,
  }));
  // External store selection replaces the applied filters without losing drafts on accordion toggles.
  const draft = form.applied === appliedFilters ? form.draft : appliedFilters;
  const error = form.applied === appliedFilters ? form.error : null;
  const [opened, setOpened] = useState<string | null>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const stores = [
    ...new Map(
      history.map((entry) => [
        String(entry.restaurant.id),
        entry.restaurant.name || "Άγνωστο κατάστημα",
      ]),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "el"));
  const payments = [...new Set(history.map((entry) => entry.payment))].sort();
  const activeCount = Object.values(appliedFilters).filter(Boolean).length;
  const dateLabel = (value: string) => value.split("-").reverse().join("/");
  const summary = [
    appliedFilters.search && `«${appliedFilters.search}»`,
    appliedFilters.restaurant &&
      stores.find(([id]) => id === appliedFilters.restaurant)?.[1],
    appliedFilters.payment && paymentLabel(appliedFilters.payment),
    appliedFilters.from && `Από ${dateLabel(appliedFilters.from)}`,
    appliedFilters.through && `Έως ${dateLabel(appliedFilters.through)}`,
    appliedFilters.min &&
      `Από ${formatAmount(Number(appliedFilters.min.replace(",", ".")))}`,
    appliedFilters.max &&
      `Έως ${formatAmount(Number(appliedFilters.max.replace(",", ".")))}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const update = (key: keyof OrderFilters, value: string) => {
    setForm({
      applied: appliedFilters,
      draft: { ...draft, [key]: value },
      error: null,
    });
  };
  return (
    <Card
      component="section"
      aria-label="Φίλτρα παραγγελιών"
      className={styles.panel}
      bg="var(--analytics-panel-bg)"
      withBorder
      my="md"
      p={0}
    >
      <Accordion
        value={opened}
        onChange={setOpened}
        order={2}
        keepMounted={false}
        styles={{ item: { borderBottom: 0 } }}
      >
        <Accordion.Item value="filters">
          <Accordion.Control ref={controlRef}>
            <Group component="span" gap="sm" justify="space-between">
              <Group component="span" gap="sm">
                <Text component="span" fw={600}>
                  Φίλτρα
                </Text>
                {activeCount > 0 ? (
                  <Badge size="sm" variant="light">
                    {activeCount} {activeCount === 1 ? "ενεργό" : "ενεργά"}
                  </Badge>
                ) : null}
              </Group>
              {activeCount > 0 ? (
                <Text component="span" size="sm" c="dimmed" role="status">
                  {matchingCount}{" "}
                  {matchingCount === 1 ? "παραγγελία" : "παραγγελίες"}
                </Text>
              ) : null}
            </Group>
            {summary ? (
              <Text
                component="span"
                size="xs"
                c="dimmed"
                display="block"
                mt={4}
              >
                {summary}
              </Text>
            ) : null}
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed" mb="sm">
              Τα φίλτρα αλλάζουν και τα στατιστικά παρακάτω.
            </Text>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const message = validateOrderFilters(draft);
                setForm({
                  applied: appliedFilters,
                  draft: { ...draft },
                  error: message,
                });
                if (!message) {
                  onApply({ ...draft });
                  setOpened(null);
                  controlRef.current?.focus();
                }
              }}
            >
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                <TextInput
                  label="Αναζήτηση καταστήματος"
                  value={draft.search}
                  onChange={(event) =>
                    update("search", event.currentTarget.value)
                  }
                />
                <NativeSelect
                  label="Κατάστημα"
                  value={draft.restaurant}
                  onChange={(event) =>
                    update("restaurant", event.currentTarget.value)
                  }
                  data={[
                    { value: "", label: "Όλα τα καταστήματα" },
                    ...stores.map(([value, label]) => ({ value, label })),
                  ]}
                />
                <NativeSelect
                  label="Τρόπος πληρωμής"
                  value={draft.payment}
                  onChange={(event) =>
                    update("payment", event.currentTarget.value)
                  }
                  data={[
                    { value: "", label: "Όλοι οι τρόποι" },
                    ...payments.map((value) => ({
                      value,
                      label: paymentLabel(value),
                    })),
                  ]}
                />
                <TextInput
                  type="date"
                  label="Από ημερομηνία"
                  value={draft.from}
                  onChange={(event) =>
                    update("from", event.currentTarget.value)
                  }
                />
                <TextInput
                  type="date"
                  label="Έως ημερομηνία"
                  value={draft.through}
                  onChange={(event) =>
                    update("through", event.currentTarget.value)
                  }
                />
                <Group grow align="flex-start">
                  <TextInput
                    label="Ελάχιστο ποσό (€)"
                    inputMode="decimal"
                    value={draft.min}
                    onChange={(event) =>
                      update("min", event.currentTarget.value)
                    }
                  />
                  <TextInput
                    label="Μέγιστο ποσό (€)"
                    inputMode="decimal"
                    value={draft.max}
                    onChange={(event) =>
                      update("max", event.currentTarget.value)
                    }
                  />
                </Group>
              </SimpleGrid>
              {error ? (
                <Alert color="red" title="Έλεγξε τα φίλτρα" mt="sm">
                  {error}
                </Alert>
              ) : null}
              <Group mt="md">
                <Button type="submit">Εφαρμογή</Button>
                <Button
                  type="button"
                  variant="default"
                  disabled={
                    !hasOrderFilters(draft) && !hasOrderFilters(appliedFilters)
                  }
                  onClick={() => {
                    setForm({
                      applied: appliedFilters,
                      draft: { ...EMPTY_ORDER_FILTERS },
                      error: null,
                    });
                    onApply({ ...EMPTY_ORDER_FILTERS });
                  }}
                >
                  Καθαρισμός
                </Button>
              </Group>
            </form>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Card>
  );
}
