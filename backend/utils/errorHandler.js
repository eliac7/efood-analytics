/**
 * Creates a safe error message for client responses
 * In production, sensitive error details are hidden
 * @param {Error} err - The error object
 * @returns {string} - Safe error message
 */
export function getSafeErrorMessage(err) {
  if (process.env.NODE_ENV === "production") {
    return "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα.";
  }
  return err?.message || "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα.";
}

/**
 * Extracts status code from axios error or defaults to provided code
 * @param {Error} err - The error object
 * @param {number} defaultCode - Default status code
 * @returns {number} - HTTP status code
 */
export function getErrorStatusCode(err, defaultCode = 400) {
  return err?.response?.status || defaultCode;
}

/**
 * Handles rate limit (429) errors from e-food API
 * @param {Error} err - The error object
 * @returns {{ isRateLimited: boolean, retryAfterMinutes?: number }}
 */
export function handleRateLimitError(err) {
  const statusCode = getErrorStatusCode(err);
  
  if (statusCode === 429) {
    const retryAfter = err.response?.headers?.["retry-after"] || 60;
    const retryAfterMinutes = Math.ceil(retryAfter / 60);
    return { isRateLimited: true, retryAfterMinutes };
  }
  
  return { isRateLimited: false };
}

/**
 * Express error handling middleware
 */
export function errorMiddleware(err, req, res, next) {
  const { isRateLimited, retryAfterMinutes } = handleRateLimitError(err);
  
  if (isRateLimited) {
    return res.status(429).json({
      message: `Too many requests. Please try again in ${retryAfterMinutes} minutes`,
    });
  }
  
  const statusCode = getErrorStatusCode(err);
  const message = getSafeErrorMessage(err);
  
  return res.status(statusCode).json({ message });
}

