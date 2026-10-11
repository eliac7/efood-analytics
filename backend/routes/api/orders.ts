import express from "express";
import type { Request, Response, Router } from "express";
import { readFile } from "fs/promises";
import { resolve } from "node:path";
import checkSession from "../../middlewares/checkSession.js";
import checkResStatus from "../../middlewares/checkResStatus.js";
import { fetchAllOrders } from "../../services/orderService.js";
import { analyzeOrders } from "../../services/orderAnalytics.js";
import {
  getErrorStatusCode,
  getSafeErrorMessage,
  handleRateLimitError,
  toHttpError,
  getRetryAfterSeconds,
} from "../../utils/errorHandler.js";
import type { OrderService } from "../../types.js";
import { normalizeOrders } from "../../services/orderValidation.js";

const useMockData = () => process.env.MOCK_DATA === "true" && process.env.NODE_ENV === "development";

/**
 * Load mock orders for development
 * @returns {Promise<Object>} - Mock order data
 */
async function loadMockOrders() {
  try {
      const file = resolve(process.env.MOCK_ORDERS_FILE || "data/my-orders.json");
      const rawData = await readFile(file, "utf-8");
      return normalizeOrders(JSON.parse(rawData));
  } catch (err: unknown) {
    console.error("Failed to load mock orders:", toHttpError(err).message);
    throw new Error("Mock data not available");
  }
}

/**
 * GET /api/orders
 * Fetch and analyze all user orders
 */
async function handleGetOrders(
  req: Request,
  res: Response,
  orderService: OrderService
): Promise<Response> {
  const sessionId = req.headers.session_id as string;

  try {
      const allOrders = useMockData() ? await loadMockOrders() : await orderService.fetchAllOrders(sessionId);

    const analyzedOrders = orderService.analyzeOrders(allOrders);

    return res.status(200).json({
      orders: analyzedOrders,
      message: "Οι παραγγελίες ανακτήθηκαν επιτυχώς",
    });
  } catch (err) {
    const rateLimit = handleRateLimitError(err);
    if (rateLimit.isRateLimited) {
        res.setHeader("Retry-After", getRetryAfterSeconds(toHttpError(err).response?.headers?.["retry-after"]));
      return res.status(429).json({
        message: `Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά σε ${rateLimit.retryAfterMinutes} λεπτά`,
      });
    }

    const statusCode = getErrorStatusCode(err);
    const message = getSafeErrorMessage(err);
    return res.status(statusCode).json({ message });
  }
}

export function createOrdersRouter(
  orderService: OrderService = { fetchAllOrders, analyzeOrders }
): Router {
  const router = express.Router();

  router.get("/", [checkSession, checkResStatus], (req: Request, res: Response) =>
    handleGetOrders(req, res, orderService)
  );

  router.all("/", (req, res) => {
    res.status(405).json({ message: "Method not allowed. Please use GET method." });
  });

  return router;
}

const router = createOrdersRouter();
export default router;
