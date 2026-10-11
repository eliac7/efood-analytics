import type {
  ComparedPeriod,
  EfoodOrder,
  MetricChange,
  OrderTimeline,
  PeriodComparison,
  PeriodMetrics,
  TimeBucket,
} from "../../../types.js";
import { getOrderDateParts, parseOrderDate } from "../../../utils/orderDate.js";
import { toCents } from "./money.js";

const DAY = 86400000;
// UTC is used only for arithmetic on Athens calendar dates, never to assign orders to days.
const calendarDay = (year: number, month: number, day: number) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime() / DAY;
};
const dateKey = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
const yearOf = (day: number) => new Date(day * DAY).getUTCFullYear();
const monthStart = (day: number) => {
  const date = new Date(day * DAY);
  return calendarDay(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
};
const nextMonth = (day: number) => {
  const date = new Date(day * DAY);
  return calendarDay(date.getUTCFullYear(), date.getUTCMonth() + 2, 1);
};
const weekStart = (day: number) =>
  Math.max(
    day - ((new Date(day * DAY).getUTCDay() + 6) % 7),
    calendarDay(yearOf(day), 1, 1),
  );
type DatedAmount = { day: number; cents: number };

function metrics(values: DatedAmount[]): PeriodMetrics {
  const prices = values.map(({ cents }) => cents).sort((a, b) => a - b);
  const total = prices.reduce((sum, price) => sum + price, 0);
  const middle = Math.floor(prices.length / 2);
  return {
    totalOrders: prices.length,
    totalPrice: total / 100,
    averagePrice: prices.length
      ? Math.round(total / prices.length) / 100
      : null,
    medianPrice: prices.length
      ? Math.round(
          prices.length % 2
            ? prices[middle]
            : (prices[middle - 1] + prices[middle]) / 2,
        ) / 100
      : null,
  };
}

function change(current: number, previous: number): MetricChange {
  const absolute = (toCents(current) - toCents(previous)) / 100;
  return {
    absolute,
    percent:
      previous === 0 ? null : Math.round((absolute / previous) * 1000) / 10,
  };
}

/** Observed history window, with complete-day comparisons anchored to this sync. */
export function calculateTimeline(
  orders: EfoodOrder[],
  asOf: Date,
): OrderTimeline {
  if (!Number.isFinite(asOf.getTime()))
    throw new Error("Invalid analytics reference date");
  const reference = getOrderDateParts(asOf);
  const today = calendarDay(reference.year, reference.month, reference.day);
  const values: DatedAmount[] = [];
  let undatedOrders = 0,
    undatedCents = 0,
    futureOrders = 0,
    futureCents = 0;
  for (const order of orders) {
    const date = parseOrderDate(order.submission_date),
      cents = toCents(order.price);
    if (!date) {
      undatedOrders++;
      undatedCents += cents;
      continue;
    }
    if (date.getTime() > asOf.getTime()) {
      futureOrders++;
      futureCents += cents;
      continue;
    }
    const p = getOrderDateParts(date);
    values.push({ day: calendarDay(p.year, p.month, p.day), cents });
  }
  const first = values.reduce<number | null>(
    (earliest, value) =>
      earliest === null ? value.day : Math.min(earliest, value.day),
    null,
  );
  const byMonth = new Map<number, DatedAmount[]>(),
    byWeek = new Map<number, DatedAmount[]>();
  for (const value of values) {
    for (const [map, start] of [
      [byMonth, monthStart(value.day)],
      [byWeek, weekStart(value.day)],
    ] as const) {
      const group = map.get(start) ?? [];
      group.push(value);
      map.set(start, group);
    }
  }
  const buckets = (weekly: boolean): TimeBucket[] => {
    if (first === null) return [];
    const result: TimeBucket[] = [];
    for (
      let start = weekly ? weekStart(first) : monthStart(first);
      start <= today;
    ) {
      const end = weekly
        ? Math.min(
            start + 6 - ((new Date(start * DAY).getUTCDay() + 6) % 7),
            calendarDay(yearOf(start) + 1, 1, 1) - 1,
          )
        : nextMonth(start) - 1;
      result.push({
        key: weekly ? dateKey(start) : dateKey(start).slice(0, 7),
        from: dateKey(start),
        through: dateKey(end),
        partial: start < first || end >= today || (weekly && end - start !== 6),
        ...metrics((weekly ? byWeek : byMonth).get(start) ?? []),
      });
      start = end + 1;
    }
    return result;
  };
  const period = (start: number, days: number): ComparedPeriod => ({
    from: dateKey(start),
    through: dateKey(start + Math.max(days, 1) - 1),
    complete:
      days > 0 &&
      first !== null &&
      start >= first &&
      start + days <= today &&
      undatedOrders === 0 &&
      futureOrders === 0,
    ...metrics(
      values.filter((value) => value.day >= start && value.day < start + days),
    ),
  });
  const compare = (
    key: string,
    start: number,
    previousStart: number,
    days: number,
  ): PeriodComparison => {
    const current = period(start, days),
      previous = period(previousStart, days);
    return {
      key,
      days,
      current,
      previous,
      change:
        current.complete && previous.complete
          ? {
              totalPrice: change(current.totalPrice, previous.totalPrice),
              totalOrders: change(current.totalOrders, previous.totalOrders),
              averagePrice:
                current.averagePrice === null || previous.averagePrice === null
                  ? null
                  : change(current.averagePrice, previous.averagePrice),
              medianPrice:
                current.medianPrice === null || previous.medianPrice === null
                  ? null
                  : change(current.medianPrice, previous.medianPrice),
            }
          : null,
    };
  };
  const thisMonth = monthStart(today),
    previousMonth = monthStart(thisMonth - 1);
  const comparisons = [
    compare(
      "month",
      thisMonth,
      previousMonth,
      Math.min(today - thisMonth, thisMonth - previousMonth),
    ),
    compare("days30", today - 30, today - 60, 30),
    compare("days90", today - 90, today - 180, 90),
  ];
  const years = new Set(values.map((value) => yearOf(value.day)));
  years.add(reference.year);
  for (const year of [...years].sort((a, b) => b - a)) {
    const start = calendarDay(year, 1, 1),
      previous = calendarDay(year - 1, 1, 1);
    // Equal calendar-day counts also handle leap years without comparing unequal windows.
    const days = Math.min(
      year === reference.year
        ? today - start
        : calendarDay(year + 1, 1, 1) - start,
      start - previous,
    );
    comparisons.push(compare(`year:${year}`, start, previous, days));
  }
  return {
    asOf: asOf.toISOString(),
    coverage: {
      from: first === null ? null : dateKey(first),
      through: dateKey(today),
      undatedOrders,
      undatedAmount: undatedCents / 100,
      futureOrders,
      futureAmount: futureCents / 100,
    },
    months: buckets(false),
    weeks: buckets(true),
    comparisons,
  };
}
