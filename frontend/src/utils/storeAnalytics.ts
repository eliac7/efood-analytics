import type { OrderHistoryEntry, Restaurant } from "../types";
import { parseOrderDate } from "./orderDate";
import { toCents } from "../../../backend/services/analytics/orders/money.js";

export interface StoreRow extends Restaurant {
  firstOrder: string | null;
  lastOrder: string | null;
  undatedOrders: number;
  average: number | null;
  share: number | null;
}
export type StoreMetric = "amount" | "orders";
export type StoreSort = StoreMetric | "average";

export function hasStoreLocation<T extends Restaurant>(
  store: T,
): store is T & { latitude: number; longitude: number } {
  return (
    typeof store.latitude === "number" &&
    Number.isFinite(store.latitude) &&
    Math.abs(store.latitude) <= 90 &&
    typeof store.longitude === "number" &&
    Number.isFinite(store.longitude) &&
    Math.abs(store.longitude) <= 180
  );
}

export function buildStoreRows(
  restaurants: Restaurant[],
  history: OrderHistoryEntry[],
  totalPrice: number,
): StoreRow[] {
  const dates = new Map<
    string,
    { first: string | null; last: string | null; missing: number }
  >();
  for (const entry of history) {
    const id = String(entry.restaurant.id);
    const value = dates.get(id) ?? { first: null, last: null, missing: 0 };
    const date = parseOrderDate(entry.submissionDate);
    if (date) {
      const stamp = date.toISOString();
      if (!value.first || stamp < value.first) value.first = stamp;
      if (!value.last || stamp > value.last) value.last = stamp;
    } else value.missing++;
    dates.set(id, value);
  }
  const totalCents = toCents(totalPrice);
  return restaurants.map((store) => {
    const value = dates.get(String(store.id));
    const cents = toCents(store.totalPrice);
    return {
      ...store,
      firstOrder: value?.first ?? null,
      lastOrder: value?.last ?? null,
      undatedOrders: value?.missing ?? 0,
      average: store.orders > 0 ? cents / 100 / store.orders : null,
      share: totalCents > 0 ? (cents / totalCents) * 100 : null,
    };
  });
}

export function sortStores(stores: StoreRow[], sort: StoreSort): StoreRow[] {
  const value = (s: StoreRow) =>
    sort === "amount"
      ? toCents(s.totalPrice)
      : sort === "orders"
        ? s.orders
        : (s.average ?? -1);
  return [...stores].sort(
    (a, b) =>
      value(b) - value(a) ||
      (a.name ?? "").localeCompare(b.name ?? "", "el") ||
      String(a.id).localeCompare(String(b.id)),
  );
}

export interface StorePoint {
  key: string;
  position: [number, number];
  stores: StoreRow[];
  amount: number;
  orders: number;
}

/** Identical positions share a popup so one store cannot hide another. */
export function groupStorePoints(stores: StoreRow[]): StorePoint[] {
  const points = new Map<string, StorePoint>();
  for (const store of stores) {
    if (!hasStoreLocation(store)) continue;
    const key = `${store.latitude},${store.longitude}`;
    const point = points.get(key) ?? {
      key,
      position: [store.latitude, store.longitude],
      stores: [],
      amount: 0,
      orders: 0,
    };
    point.stores.push(store);
    point.amount += toCents(store.totalPrice);
    point.orders += store.orders;
    points.set(key, point);
  }
  return Array.from(points.values()).map((point) => ({
    ...point,
    amount: point.amount / 100,
  }));
}

/** Area follows value; a minimum radius keeps zero/small points visible. */
export function storePointRadius(value: number, maximum: number): number {
  return maximum > 0
    ? Math.max(6, 28 * Math.sqrt(Math.max(0, value) / maximum))
    : 6;
}
export const formatStoreShare = (share: number | null) =>
  share === null
    ? "—"
    : `${share.toLocaleString("el-GR", { maximumFractionDigits: 1 })}%`;
