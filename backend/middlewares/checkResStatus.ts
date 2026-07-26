import type { NextFunction, Request, Response } from "express";

interface ResponseWithData extends Response {
  data?: {
    status?: string;
    message?: string;
  };
}

/**
 * Middleware to check response status from previous middleware/handlers
 */
export default function checkResStatus(_req: Request, res: Response, next: NextFunction): void {
  const responseWithData = res as ResponseWithData;
  if (responseWithData.data?.status === "error") {
    res.status(400).json({ message: responseWithData.data.message || "Η αίτηση απέτυχε" });
    return;
  }
  next();
}
