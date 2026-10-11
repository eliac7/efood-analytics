import type { ErrorRequestHandler } from "express";
import type { HttpErrorLike } from "../types.js";

export function toHttpError(err: unknown): HttpErrorLike {
  if (!err || typeof err !== "object") {
    return {};
  }
  return err as HttpErrorLike;
}

/**
 * Creates a safe error message for client responses
 * In production, sensitive error details are hidden
 * @param {Error} err - The error object
 * @returns {string} - Safe error message
 */
export function getSafeErrorMessage(err: unknown): string {
  if (process.env.NODE_ENV === "production") {
    return "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα.";
  }
  const message = toHttpError(err).message;
  return typeof message === "string" && message.trim() ? message : "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα.";
}

/**
 * Extracts status code from axios error or defaults to provided code
 * @param {Error} err - The error object
 * @param {number} defaultCode - Default status code
 * @returns {number} - HTTP status code
 */
export function getErrorStatusCode(err: unknown, defaultCode = 500): number {
  const error = toHttpError(err);
  const status = error.response?.status ?? error.status;
  if (typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599) return status;
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return 504;
  if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "ECONNRESET" || error.code === "ERR_NETWORK") return 502;
  return defaultCode;
}

export function getRetryAfterSeconds(value: unknown, now = Date.now()): number {
  if ((typeof value === "number" || (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value))) &&
      Number.isFinite(Number(value)) && Number(value) >= 0) return Math.ceil(Number(value));
  if (typeof value === "string") {
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(0, Math.ceil((date - now) / 1000));
  }
  return 60;
}

/**
 * Handles rate limit (429) errors from e-food API
 * @param {Error} err - The error object
 * @returns {{ isRateLimited: boolean, retryAfterMinutes?: number }}
 */
export function handleRateLimitError(
  err: unknown
): { isRateLimited: false } | { isRateLimited: true; retryAfterMinutes: number } {
  const statusCode = getErrorStatusCode(err);
  
  if (statusCode === 429) {
    const retryAfter = getRetryAfterSeconds(toHttpError(err).response?.headers?.["retry-after"]);
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfter / 60));
    return { isRateLimited: true, retryAfterMinutes };
  }
  
  return { isRateLimited: false };
}

/**
 * Express error handling middleware
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) { next(err); return; }
  const rateLimit = handleRateLimitError(err);
  
  if (rateLimit.isRateLimited) {
    res.setHeader("Retry-After", getRetryAfterSeconds(toHttpError(err).response?.headers?.["retry-after"]));
    return res.status(429).json({
      message: `Too many requests. Please try again in ${rateLimit.retryAfterMinutes} minutes`,
    });
  }
  
  const statusCode = getErrorStatusCode(err);
  const message = getSafeErrorMessage(err);
  
  return res.status(statusCode).json({ message });
};
