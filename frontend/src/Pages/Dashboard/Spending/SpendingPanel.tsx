import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  Group,
  NativeSelect,
  ScrollArea,
  Table,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type {
  MetricChange,
  OrderTimeline,
  PeriodComparison,
  TimeBucket,
} from "../../../types";
import { formatAmount, NO_DATA } from "../../../utils/helpers";
import styles from "../AnalyticsPanel.module.css";

const dateLabel = (value: string) => value.split("-").reverse().join("/");
const decimal = (value: number) =>
  value.toLocaleString("el-GR", { maximumFractionDigits: 1 });
const sign = (value: number) => (value > 0 ? "+" : "");
const periodLabel = (bucket: TimeBucket, weekly: boolean) =>
  weekly
    ? `${dateLabel(bucket.from)}–${dateLabel(bucket.through)}`
    : `${bucket.key.slice(5)}/${bucket.key.slice(0, 4)}`;

function ChangeValue({
  value,
  money,
}: {
  value: MetricChange | null;
  money: boolean;
}) {
  if (!value) return <Text c="dimmed">{NO_DATA}</Text>;
  return (
    <Text>
      {sign(value.absolute)}
      {money ? formatAmount(value.absolute) : decimal(value.absolute)}
      <Text component="span" size="sm" c="dimmed">
        {value.percent === null
          ? " · ποσοστό μη διαθέσιμο (προηγούμενο ποσό μηδέν)"
          : ` · ${sign(value.percent)}${decimal(value.percent)}%`}
      </Text>
    </Text>
  );
}

function ComparisonTable({ comparison }: { comparison: PeriodComparison }) {
  const { current, previous, change } = comparison;
  const rows = [
    { key: "totalPrice", label: "Δαπάνη", money: true },
    { key: "totalOrders", label: "Παραγγελίες", money: false },
    { key: "averagePrice", label: "Μέσο ποσό", money: true },
    { key: "medianPrice", label: "Διάμεσο ποσό", money: true },
  ] as const;
  return (
    <>
      <Text size="sm" my="sm">
        {comparison.days} ολοκληρωμένες ημέρες ανά περίοδο. Τρέχουσα:{" "}
        {dateLabel(current.from)}–{dateLabel(current.through)}. Προηγούμενη:{" "}
        {dateLabel(previous.from)}–{dateLabel(previous.through)}.
      </Text>
      {change === null ? (
        <Alert color="blue" title="Η σύγκριση δεν είναι διαθέσιμη" mb="sm">
          {comparison.days === 0
            ? "Δεν έχει ολοκληρωθεί ακόμη ημέρα στην επιλεγμένη περίοδο."
            : "Δεν υπάρχει πλήρης χρονική κάλυψη και για τις δύο περιόδους. Τα παρακάτω ποσά περιλαμβάνουν μόνο τις παραγγελίες με διαθέσιμη ημερομηνία και δεν χρησιμοποιούνται για υπολογισμό μεταβολής."}
        </Alert>
      ) : null}
      <ScrollArea>
        <Table miw={550} striped withTableBorder>
          <Table.Caption>Σύγκριση ισότιμων περιόδων</Table.Caption>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Μετρική</Table.Th>
              <Table.Th>
                Τρέχουσα{!current.complete ? " (ελλιπής κάλυψη)" : ""}
              </Table.Th>
              <Table.Th>
                Προηγούμενη{!previous.complete ? " (ελλιπής κάλυψη)" : ""}
              </Table.Th>
              <Table.Th>Μεταβολή</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map(({ key, label, money }) => (
              <Table.Tr key={key}>
                <Table.Th scope="row">{label}</Table.Th>
                <Table.Td>
                  {money ? formatAmount(current[key]) : current[key]}
                </Table.Td>
                <Table.Td>
                  {money ? formatAmount(previous[key]) : previous[key]}
                </Table.Td>
                <Table.Td>
                  <ChangeValue value={change?.[key] ?? null} money={money} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}

export default function SpendingPanel({
  timeline,
  year,
}: {
  timeline: OrderTimeline;
  year: string;
}) {
  const [frequency, setFrequency] = useState("months");
  const [range, setRange] = useState("24");
  const [comparisonKey, setComparisonKey] = useState("month");
  const { colorScheme } = useMantineColorScheme();
  const weekly = frequency === "weeks";
  const buckets = useMemo(() => {
    const source = weekly ? timeline.weeks : timeline.months;
    const filtered =
      year === "all"
        ? source
        : source.filter((b) => b.from.startsWith(`${year}-`));
    return range === "all" ? filtered : filtered.slice(-Number(range));
  }, [timeline, weekly, year, range]);
  const labels = buckets.map((b) => periodLabel(b, weekly));
  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        toolbar: { show: false },
        foreColor: colorScheme === "dark" ? "#fff" : "#2E4053",
        animations: { enabled: false },
      },
      xaxis: {
        categories: buckets.map((b) => periodLabel(b, weekly)),
        labels: { hideOverlappingLabels: true },
      },
      yaxis: { labels: { formatter: (value: number) => formatAmount(value) } },
      tooltip: { y: { formatter: (value: number) => formatAmount(value) } },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      stroke: { width: 2, curve: "straight" },
    }),
    [buckets, weekly, colorScheme],
  );
  const referenceYear = timeline.coverage.through.slice(0, 4);
  const activeKey = year === "all" ? comparisonKey : `year:${year}`;
  const comparison = timeline.comparisons.find((c) => c.key === activeKey);
  const c = timeline.coverage;

  return (
    <Card
      component="section"
      aria-label="Δαπάνη και τάσεις"
      withBorder
      radius="md"
      my="md"
      p="lg"
      className={styles.panel}
      bg="var(--analytics-panel-bg)"
    >
      <Group justify="space-between">
        <Title order={2} size="h3">
          Δαπάνη και τάσεις
        </Title>
        <Badge variant="light">{year === "all" ? "Όλα τα έτη" : year}</Badge>
      </Group>
      <Text size="sm" c="dimmed" mt="xs">
        Συγχρονισμός:{" "}
        {new Date(timeline.asOf).toLocaleString("el-GR", {
          timeZone: "Europe/Athens",
        })}{" "}
        (ώρα Αθήνας). Παρατηρημένο ιστορικό:{" "}
        {c.from ? `${dateLabel(c.from)}–${dateLabel(c.through)}` : NO_DATA}.
      </Text>
      <Text size="sm" c="dimmed" mb="md">
        Η σημερινή ημέρα περιλαμβάνεται στη χρονοσειρά μέχρι τον συγχρονισμό. Οι
        συγκρίσεις χρησιμοποιούν μόνο ολοκληρωμένες ημέρες, ίδιο αριθμό ημερών
        και τις ημερομηνίες που αναγράφονται παρακάτω. Σε μικρότερο μήνα ή
        δίσεκτο έτος περιορίζονται και οι δύο περίοδοι στο κοινό πλήθος ημερών.
      </Text>
      {c.undatedOrders > 0 || c.futureOrders > 0 ? (
        <Alert color="orange" title="Ποσά εκτός χρονοσειράς" mb="md">
          {c.undatedOrders > 0
            ? `${c.undatedOrders} παραγγελίες (${formatAmount(c.undatedAmount)}) χωρίς έγκυρη ημερομηνία. `
            : ""}
          {c.futureOrders > 0
            ? `${c.futureOrders} παραγγελίες (${formatAmount(c.futureAmount)}) με ημερομηνία μετά τον συγχρονισμό. `
            : ""}
          Παραμένουν στη συνολική δαπάνη. Οι χρονικές συγκρίσεις δεν υπολογίζουν
          μεταβολή όσο υπάρχουν μη κατανεμημένα ποσά.
        </Alert>
      ) : null}
      <Group align="flex-end" mb="sm">
        <NativeSelect
          label="Ομαδοποίηση δαπάνης"
          value={frequency}
          onChange={(event) => setFrequency(event.currentTarget.value)}
          data={[
            { value: "months", label: "Μήνας" },
            { value: "weeks", label: "Εβδομάδα" },
          ]}
        />
        <NativeSelect
          label="Διάστημα γραφήματος"
          value={range}
          onChange={(event) => setRange(event.currentTarget.value)}
          data={[
            { value: "24", label: "Τελευταίες 24 περίοδοι" },
            { value: "52", label: "Τελευταίες 52 περίοδοι" },
            { value: "all", label: "Όλες οι περίοδοι" },
          ]}
        />
      </Group>
      {buckets.length > 0 ? (
        <>
          <div
            role="img"
            aria-label={`Γράφημα δαπάνης ανά ${weekly ? "εβδομάδα" : "μήνα"}. Οι ακριβείς τιμές βρίσκονται στον πίνακα.`}
          >
            <ReactApexChart
              type="bar"
              height={280}
              options={options}
              series={[
                { name: "Δαπάνη", data: buckets.map((b) => b.totalPrice) },
              ]}
            />
          </div>
          <Text size="sm" c="dimmed" mb="sm">
            Τα κενά μέσα στο παρατηρημένο ιστορικό εμφανίζονται ως μηδέν. Οι
            οριακές περίοδοι επισημαίνονται ως μερικές. Οι εβδομάδες αρχίζουν
            Δευτέρα και χωρίζονται στην αλλαγή έτους.
          </Text>
          <ScrollArea h={290}>
            <Table miw={580} striped stickyHeader>
              <Table.Caption>
                Δαπάνη ανά {weekly ? "εβδομάδα" : "μήνα"}
              </Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  {[
                    "Περίοδος",
                    "Δαπάνη",
                    "Πλήθος",
                    "Μέσο ποσό",
                    "Διάμεσο ποσό",
                  ].map((label) => (
                    <Table.Th key={label}>{label}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {buckets.map((bucket, index) => (
                  <Table.Tr key={bucket.key}>
                    <Table.Th scope="row">
                      {labels[index]}
                      {bucket.partial ? (
                        <Text size="xs" c="dimmed">
                          Μερική περίοδος
                        </Text>
                      ) : null}
                    </Table.Th>
                    <Table.Td>{formatAmount(bucket.totalPrice)}</Table.Td>
                    <Table.Td>{bucket.totalOrders}</Table.Td>
                    <Table.Td>{formatAmount(bucket.averagePrice)}</Table.Td>
                    <Table.Td>{formatAmount(bucket.medianPrice)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </>
      ) : (
        <Text my="md">{NO_DATA}</Text>
      )}
      <Title order={3} size="h4" mt="lg">
        Σύγκριση περιόδων
      </Title>
      {year === "all" ? (
        <NativeSelect
          label="Περίοδος σύγκρισης"
          value={comparisonKey}
          onChange={(event) => setComparisonKey(event.currentTarget.value)}
          mt="sm"
          data={[
            { value: "month", label: "Τρέχων μήνας / προηγούμενος μήνας" },
            {
              value: "days30",
              label: "Τελευταίες 30 ημέρες / προηγούμενες 30",
            },
            {
              value: "days90",
              label: "Τελευταίες 90 ημέρες / προηγούμενες 90",
            },
            {
              value: `year:${referenceYear}`,
              label: `${referenceYear} / ${Number(referenceYear) - 1}`,
            },
          ]}
        />
      ) : (
        <Text size="sm" mt="sm">
          {year} / {Number(year) - 1}
        </Text>
      )}
      {comparison ? (
        <ComparisonTable comparison={comparison} />
      ) : (
        <Text my="sm">{NO_DATA}</Text>
      )}
      <Text size="xs" c="dimmed" mt="sm">
        Η μεταβολή του μέσου καλαθιού περιλαμβάνει αλλαγές σε προϊόντα,
        καταστήματα και είδη αγορών. Δεν αποτελεί δείκτη πληθωρισμού.
      </Text>
    </Card>
  );
}
