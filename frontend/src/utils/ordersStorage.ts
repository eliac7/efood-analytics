import type { Orders } from "../types";
import { LOCAL_STORAGE_ORDERS, ORDERS_CACHE_VERSION } from "./constants";

export function getStoredOrders(): Orders | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      parsed.cacheVersion !== ORDERS_CACHE_VERSION ||
      !parsed.all ||
      !Array.isArray(parsed.perYear) ||
      typeof parsed.timestamp !== "string"
    ) {
      throw new Error("Invalid or outdated analytics cache");
    }
    const timestamp = new Date(parsed.timestamp);
    if (!Number.isFinite(timestamp.getTime())) {
      throw new Error("Invalid cache timestamp");
    }
    return { ...parsed, timestamp } as Orders;
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_ORDERS);
    return null;
  }
}
