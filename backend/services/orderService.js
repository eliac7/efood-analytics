import axios from "axios";

const EFOOD_ORDERS_URL = "https://api.e-food.gr/api/v1/user/orders/history";
const ORDERS_PER_PAGE = 100;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
};

/**
 * Fetch a page of user orders from e-food API
 * @param {string} sessionId - E-food session ID
 * @param {number} offset - Pagination offset
 * @returns {Promise<Object>} - API response with orders
 */
export async function fetchOrdersPage(sessionId, offset = 0) {
  const url = new URL(EFOOD_ORDERS_URL);
  url.searchParams.append("limit", ORDERS_PER_PAGE);
  url.searchParams.append("offset", offset);
  url.searchParams.append("mode", "extended");

  const response = await axios.get(url.toString(), {
    headers: {
      ...DEFAULT_HEADERS,
      "x-core-session-id": sessionId,
    },
  });

  return response.data;
}

/**
 * Fetch all user orders by paginating through the API
 * @param {string} sessionId - E-food session ID
 * @returns {Promise<Array>} - All user orders
 */
export async function fetchAllOrders(sessionId) {
  const allOrders = [];
  let offset = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await fetchOrdersPage(sessionId, offset);
    const { orders, hasNext: morePages } = response.data;

    allOrders.push(...orders);
    hasNext = morePages;
    offset += ORDERS_PER_PAGE;
  }

  return allOrders;
}

