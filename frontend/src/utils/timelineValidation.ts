import type { OrderTimeline, PeriodMetrics } from "../types";
import { getOrderDateParts } from "./orderDate";

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const count = (v: unknown): v is number =>
  finite(v) && Number.isSafeInteger(v) && v >= 0;
const money = (v: unknown): v is number =>
  finite(v) && v >= 0 && Number.isSafeInteger(Math.round(v * 100));
const day = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
const daysBetween = (from: string, through: string) =>
  (Date.parse(through) - Date.parse(from)) / 86400000 + 1;

function metrics(v: unknown): v is PeriodMetrics & Record<string, unknown> {
  return (
    record(v) &&
    count(v.totalOrders) &&
    money(v.totalPrice) &&
    (v.totalOrders === 0
      ? v.totalPrice === 0 && v.averagePrice === null && v.medianPrice === null
      : money(v.averagePrice) && money(v.medianPrice))
  );
}
function metricChange(
  v: unknown,
  current: number | null,
  previous: number | null,
) {
  if (current === null || previous === null) return v === null;
  const absolute =
    (Math.round(current * 100) - Math.round(previous * 100)) / 100;
  return (
    record(v) &&
    v.absolute === absolute &&
    v.percent ===
      (previous === 0 ? null : Math.round((absolute / previous) * 1000) / 10)
  );
}

export function isOrderTimeline(
  v: unknown,
  totalOrders: number,
  totalPrice: number,
): v is OrderTimeline {
  if (
    !record(v) ||
    typeof v.asOf !== "string" ||
    !Number.isFinite(Date.parse(v.asOf)) ||
    new Date(v.asOf).toISOString() !== v.asOf ||
    !record(v.coverage)
  )
    return false;
  const c = v.coverage;
  const reference = getOrderDateParts(new Date(v.asOf));
  const referenceDay = `${String(reference.year).padStart(4, "0")}-${String(reference.month).padStart(2, "0")}-${String(reference.day).padStart(2, "0")}`;
  if (
    !(c.from === null || day(c.from)) ||
    !day(c.through) ||
    c.through !== referenceDay ||
    (c.from !== null && c.from > c.through) ||
    !count(c.undatedOrders) ||
    !money(c.undatedAmount) ||
    !count(c.futureOrders) ||
    !money(c.futureAmount)
  )
    return false;
  if (
    (c.undatedOrders === 0 && c.undatedAmount !== 0) ||
    (c.futureOrders === 0 && c.futureAmount !== 0)
  )
    return false;
  for (const [name, weekly] of [
    ["months", false],
    ["weeks", true],
  ] as const) {
    const buckets = v[name];
    if (!Array.isArray(buckets)) return false;
    let orders = c.undatedOrders + c.futureOrders,
      cents =
        Math.round(c.undatedAmount * 100) + Math.round(c.futureAmount * 100),
      previousEnd: string | null = null;
    for (const b of buckets) {
      if (
        !metrics(b) ||
        !day(b.from) ||
        !day(b.through) ||
        b.from > b.through ||
        typeof b.partial !== "boolean" ||
        b.key !== (weekly ? b.from : b.from.slice(0, 7)) ||
        (weekly
          ? daysBetween(b.from, b.through) > 7 ||
            b.from.slice(0, 4) !== b.through.slice(0, 4)
          : b.from.slice(0, 7) !== b.through.slice(0, 7) ||
            !b.from.endsWith("-01")) ||
        (previousEnd !== null && daysBetween(previousEnd, b.from) !== 2)
      )
        return false;
      previousEnd = b.through;
      orders += b.totalOrders;
      cents += Math.round(b.totalPrice * 100);
    }
    if (
      orders !== totalOrders ||
      cents !== Math.round(totalPrice * 100) ||
      (c.from === null) !== (buckets.length === 0)
    )
      return false;
    if (c.from !== null && buckets.length > 0) {
      const first = buckets[0],
        last = buckets[buckets.length - 1];
      if (
        first.from > c.from ||
        first.through < c.from ||
        last.from > c.through ||
        last.through < c.through
      )
        return false;
    }
  }
  if (!Array.isArray(v.comparisons)) return false;
  const keys = new Set<string>();
  for (const comparison of v.comparisons) {
    if (
      !record(comparison) ||
      typeof comparison.key !== "string" ||
      !/^(month|days30|days90|custom|year:\d{4})$/.test(comparison.key) ||
      keys.has(comparison.key) ||
      !count(comparison.days)
    )
      return false;
    keys.add(comparison.key);
    const current = comparison.current,
      previous = comparison.previous;
    for (const p of [current, previous]) {
      if (
        !metrics(p) ||
        !day(p.from) ||
        !day(p.through) ||
        typeof p.complete !== "boolean" ||
        daysBetween(p.from, p.through) !== Math.max(comparison.days, 1) ||
        (p.complete &&
          (comparison.days === 0 ||
            c.from === null ||
            p.from < c.from ||
            p.through >= c.through ||
            c.undatedOrders > 0 ||
            c.futureOrders > 0))
      )
        return false;
    }
    if (!metrics(current) || !metrics(previous)) return false;
    const delta = comparison.change;
    if (!(current.complete && previous.complete)) {
      if (delta !== null) return false;
      continue;
    }
    if (
      !record(delta) ||
      !metricChange(
        delta.totalPrice,
        current.totalPrice,
        previous.totalPrice,
      ) ||
      !metricChange(
        delta.totalOrders,
        current.totalOrders,
        previous.totalOrders,
      ) ||
      !metricChange(
        delta.averagePrice,
        current.averagePrice as number | null,
        previous.averagePrice as number | null,
      ) ||
      !metricChange(
        delta.medianPrice,
        current.medianPrice as number | null,
        previous.medianPrice as number | null,
      )
    )
      return false;
  }
  return ["month", "days30", "days90"].every((key) => keys.has(key));
}
