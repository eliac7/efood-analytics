// UUID v4 pattern for e-food session IDs
// Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
export const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Email validation pattern
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password constraints
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Validates an e-food session ID format
 * @param {string} sessionId - The session ID to validate
 * @returns {boolean} - True if valid UUID format
 */
export function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== "string") {
    return false;
  }
  return SESSION_ID_PATTERN.test(sessionId.trim());
}

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Validates password meets requirements
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, message?: string }} - Validation result
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Ο κωδικός είναι απαραίτητος" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Ο κωδικός πρέπει να έχει τουλάχιστον ${PASSWORD_MIN_LENGTH} χαρακτήρες` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, message: `Ο κωδικός πρέπει να έχει λιγότερους από ${PASSWORD_MAX_LENGTH} χαρακτήρες` };
  }
  return { valid: true };
}

