import express from "express";
import { readFile } from "fs/promises";
import checkSession from "../../middlewares/checkSession.js";
import checkResStatus from "../../middlewares/checkResStatus.js";
import { fetchAllOrders } from "../../services/orderService.js";
import { analyzeOrders } from "../../services/orderAnalytics.js";
import {
  getSafeErrorMessage,
  handleRateLimitError,
} from "../../utils/errorHandler.js";

const USE_MOCK_DATA = process.env.MOCK_DATA === "true" && process.env.NODE_ENV === "development";

/**
 * Load mock orders for development
 * @returns {Promise<Object>} - Mock order data
 */
async function loadMockOrders() {
  try {
    const rawData = await readFile("./data/postman-orders.json", "utf-8");
    return JSON.parse(rawData);
  } catch (err) {
    console.error("Failed to load mock orders:", err.message);
    throw new Error("Mock data not available");
  }
}

/**
 * GET /api/orders
 * Fetch and analyze all user orders
 */
async function handleGetOrders(req, res, orderService) {
  const { session_id } = req.headers;

  try {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockData = await loadMockOrders();
      return res.status(200).json(mockData);
    }

    const allOrders = await orderService.fetchAllOrders(session_id);

    const analyzedOrders = orderService.analyzeOrders(allOrders);

    return res.status(200).json({
      orders: analyzedOrders,
      message: "Οι παραγγελίες ανακτήθηκαν επιτυχώς",
    });
  } catch (err) {
    const { isRateLimited, retryAfterMinutes } = handleRateLimitError(err);
    if (isRateLimited) {
      return res.status(429).json({
        message: `Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά σε ${retryAfterMinutes} λεπτά`,
      });
    }

    const statusCode = err.response?.status || 400;
    const message = getSafeErrorMessage(err);
    return res.status(statusCode).json({ message });
  }
}

export function createOrdersRouter(orderService = { fetchAllOrders, analyzeOrders }) {
  const router = express.Router();

  router.get("/", [checkSession, checkResStatus], (req, res) =>
    handleGetOrders(req, res, orderService)
  );

  router.all("/", (req, res) => {
    res.status(405).json({ message: "Method not allowed. Please use GET method." });
  });

  return router;
}

const router = createOrdersRouter();
export default router;
