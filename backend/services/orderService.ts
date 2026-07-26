import axios from "axios";
import type { EfoodOrder } from "../types.js";
import { toHttpError } from "../utils/errorHandler.js";

const EFOOD_ORDERS_URL = "https://api.e-food.gr/api/v1/user/orders/history";
const ORDERS_PER_PAGE = 100;
const PARALLEL_BATCH_SIZE = 10;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
};

/**
 * Fetch a page of user orders from e-food API
 * @param {string} sessionId - E-food session ID
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} - API response with orders and hasNext flag
 */
interface OrdersPage {
  orders: EfoodOrder[];
  hasNext: boolean;
}

interface OrdersHistoryResponse {
  data: OrdersPage;
}

export async function fetchOrdersPage(sessionId: string, offset = 0): Promise<OrdersPage> {
  const url = new URL(EFOOD_ORDERS_URL);
  url.searchParams.append("limit", String(ORDERS_PER_PAGE));
  url.searchParams.append("offset", String(offset));
  url.searchParams.append("mode", "extended");

  const response = await axios.get<OrdersHistoryResponse>(url.toString(), {
    headers: {
      ...DEFAULT_HEADERS,
      "x-core-session-id": sessionId,
    },
  });

  return response.data.data;
}

/**
 * Fetch all user orders using speculative parallel batching
 * Since the API doesn't provide a total count, we fetch pages in parallel batches
 * @param {string} sessionId - E-food session ID
 * @returns {Promise<Array>} - All user orders
 */
export async function fetchAllOrders(sessionId: string): Promise<EfoodOrder[]> {
  const allOrders: EfoodOrder[] = [];
  let currentOffset = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    const batchPromises = [];
    for (let i = 0; i < PARALLEL_BATCH_SIZE; i++) {
      const offset = currentOffset + i * ORDERS_PER_PAGE;
      batchPromises.push(
        fetchOrdersPage(sessionId, offset).catch((err: unknown) => {
          const httpError = toHttpError(err);
          console.log(
            `Error fetching offset ${offset}:`,
            httpError.response?.status,
            httpError.message
          );
          if (httpError.response?.status === 404) {
            return { orders: [], hasNext: false };
          }
          throw err;
        })
      );
    }

    const batchResults = await Promise.all(batchPromises);

    hasMorePages = false;
    for (let i = 0; i < batchResults.length; i++) {
      const result = batchResults[i];
      if (result.orders && result.orders.length > 0) {
        allOrders.push(...result.orders);
      }
      if (result.orders?.length > 0 && result.hasNext) {
        hasMorePages = true;
      }
    }

    currentOffset += PARALLEL_BATCH_SIZE * ORDERS_PER_PAGE;
  }

  return allOrders;
}
