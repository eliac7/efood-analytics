import express from "express";
const router = express.Router();

import login from "./api/login.js";
import orders from "./api/orders.js";

router.use("/login", login);
router.use("/orders", orders);
export default router;
