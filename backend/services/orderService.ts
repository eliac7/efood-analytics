import axios from "axios";
import type { EfoodOrder } from "../types.js";
import { parseOrdersPage } from "./orderValidation.js";
import { UpstreamError } from "../utils/upstreamError.js";

const EFOOD_ORDERS_URL = "https://api.e-food.gr/api/v1/user/orders/history";
const ORDERS_PER_PAGE = 100;
const MAX_PAGES = 1000;
export const UPSTREAM_TIMEOUT_MS = 30000;

export async function fetchOrdersPage(sessionId: string, offset = 0): Promise<{ orders: EfoodOrder[]; hasNext: boolean }> {
  const url = new URL(EFOOD_ORDERS_URL);
  url.searchParams.set("limit", String(ORDERS_PER_PAGE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("mode", "extended");
  const response = await axios.get<unknown>(url.toString(), {
    timeout: UPSTREAM_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json", "x-core-session-id": sessionId,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    },
  });
  return parseOrdersPage(response.data);
}

/** Read only requested pages; never convert failures into successful partial totals. */
export async function fetchAllOrders(sessionId: string): Promise<EfoodOrder[]> {
  const orders = new Map<string, EfoodOrder>();
  let offset = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchOrdersPage(sessionId, offset);
    let added = 0;
    for (const order of result.orders) {
      const key = String(order.id);
      if (!orders.has(key)) { orders.set(key, order); added += 1; }
    }
    if (!result.hasNext) return [...orders.values()];
    if (added === 0) throw new UpstreamError("Η σελιδοποίηση του ιστορικού δεν προχωρά.");
    offset += result.orders.length;
  }
  throw new UpstreamError("Το ιστορικό υπερέβη το όριο σελίδων. Η λήψη δεν ολοκληρώθηκε.");
}
