import express from "express";
const router = express.Router();

import login from "./api/login.js";
import orders from "./api/orders.js";
import health from "./api/health.js";

router.use("/login", login);
router.use("/orders", orders);
router.use("/health", health);
export default router;
