import type { Orders, User } from "../types";
import { LOCAL_STORAGE_ORDERS, ORDERS_CACHE_VERSION } from "./constants";
import { isOrderAnalytics } from "./analyticsValidation";
import { readStorage, removeStorage } from "./storage";

export function getStoredOrders(user: User | null): Orders | null {
  if (!user || typeof user.loginAt !== "number") { removeStorage(LOCAL_STORAGE_ORDERS); return null; }
  const raw = readStorage(LOCAL_STORAGE_ORDERS);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const timestampValue = parsed?.timestamp;
    if (
      !parsed ||
      parsed.cacheVersion !== ORDERS_CACHE_VERSION ||
      parsed.ownerSessionId !== user.session_id || parsed.ownerLoginAt !== user.loginAt ||
      typeof timestampValue !== "string" || !isOrderAnalytics(parsed)
    ) {
      throw new Error("Invalid or outdated analytics cache");
    }
    const timestamp = new Date(timestampValue);
    if (!Number.isFinite(timestamp.getTime()) || timestamp.getTime() > Date.now()) {
      throw new Error("Invalid cache timestamp");
    }
    return { ...parsed, timestamp, cacheVersion: ORDERS_CACHE_VERSION,
      ownerSessionId: user.session_id, ownerLoginAt: user.loginAt };
  } catch {
    removeStorage(LOCAL_STORAGE_ORDERS);
    return null;
  }
}
