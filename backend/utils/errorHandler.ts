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
  return toHttpError(err).message || "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα.";
}

/**
 * Extracts status code from axios error or defaults to provided code
 * @param {Error} err - The error object
 * @param {number} defaultCode - Default status code
 * @returns {number} - HTTP status code
 */
export function getErrorStatusCode(err: unknown, defaultCode = 400): number {
  return toHttpError(err).response?.status || defaultCode;
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
    const retryAfter = toHttpError(err).response?.headers?.["retry-after"] || 60;
    const retryAfterMinutes = Math.ceil(Number(retryAfter) / 60);
    return { isRateLimited: true, retryAfterMinutes };
  }
  
  return { isRateLimited: false };
}

/**
 * Express error handling middleware
 */
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  const rateLimit = handleRateLimitError(err);
  
  if (rateLimit.isRateLimited) {
    return res.status(429).json({
      message: `Too many requests. Please try again in ${rateLimit.retryAfterMinutes} minutes`,
    });
  }
  
  const statusCode = getErrorStatusCode(err);
  const message = getSafeErrorMessage(err);
  
  return res.status(statusCode).json({ message });
};
