import express from "express";
import cors from "cors";
import router, { createApiRouter } from "./routes/index.js";
import { errorMiddleware } from "./utils/errorHandler.js";

export function createApp({ apiRouter = router } = {}) {
  const app = express();

  // Limit request body size to prevent DoS
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  app.use(cors());

  app.use("/api", apiRouter);

  app.use(errorMiddleware);

  app.use("/", (req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
  });

  return app;
}

export { createApiRouter };
