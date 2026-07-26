import express from "express";
import type { Router } from "express";

import login, { createLoginRouter } from "./api/login.js";
import orders, { createOrdersRouter } from "./api/orders.js";
import health from "./api/health.js";
import type { ApiRouterOptions } from "../types.js";

export function createApiRouter({
  loginRouter = login,
  ordersRouter = orders,
}: ApiRouterOptions = {}): Router {
  const router = express.Router();

  router.use("/login", loginRouter);
  router.use("/orders", ordersRouter);
  router.use("/health", health);

  return router;
}

const router = createApiRouter();

export default router;
