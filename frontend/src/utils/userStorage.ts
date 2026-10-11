import type { initialStateType, User } from "../types";
import { isUser } from "./analyticsValidation";
import { LOCAL_STORAGE_ORDERS, LOCAL_STORAGE_USER, USER_SESSION_TTL_MS } from "./constants";
import { getStoredOrders } from "./ordersStorage";
import { readStorage, removeStorage } from "./storage";

export function getStoredUser(): User | null {
  try {
    const parsed: unknown = JSON.parse(readStorage(LOCAL_STORAGE_USER) ?? "null");
    if (!isUser(parsed) || typeof parsed.loginAt !== "number" || !Number.isFinite(parsed.loginAt) ||
        parsed.loginAt > Date.now() || Date.now() - parsed.loginAt >= USER_SESSION_TTL_MS) {
      throw new Error("Invalid or expired user session");
    }
    return parsed;
  } catch {
    removeStorage(LOCAL_STORAGE_USER);
    removeStorage(LOCAL_STORAGE_ORDERS);
    return null;
  }
}

export function getInitialUserState(): initialStateType {
  const user = getStoredUser();
  return { user, orders: getStoredOrders(user), loading: false, authRevision: 0 };
}
