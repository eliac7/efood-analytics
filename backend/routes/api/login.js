import express from "express";
import {
  loginWithCredentials,
  validateSession,
  getMockUserData,
} from "../../services/authService.js";
import {
  isValidSessionId,
  isValidEmail,
  validatePassword,
} from "../../constants/validation.js";
import {
  getSafeErrorMessage,
  handleRateLimitError,
} from "../../utils/errorHandler.js";

const router = express.Router();

const USE_MOCK_AUTH = process.env.MOCK_AUTH === "true" && process.env.NODE_ENV === "development";

/**
 * POST /api/login
 * Login with email and password
 */
async function handleLoginWithEmail(req, res, next) {
  // Development mock mode
  if (USE_MOCK_AUTH) {
    return res.status(200).json(getMockUserData());
  }

  const { email, password } = req.body;

  // Validate email
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: "Το email είναι απαραίτητο" });
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }

  try {
    const response = await loginWithCredentials(email.trim(), password);

    if (response?.status === "error") {
      return res.status(401).json({ message: response.message });
    }

    return res.status(200).json({
      session_id: response.data.session_id,
      name: response.data.user.first_name_in_vocative,
      message: response.message,
    });
  } catch (err) {
    // Handle rate limiting
    const { isRateLimited, retryAfterMinutes } = handleRateLimitError(err);
    if (isRateLimited) {
      return res.status(429).json({
        message: `Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά σε ${retryAfterMinutes} λεπτά`,
      });
    }

    // Handle other errors
    const statusCode = err.response?.status || 400;
    const message = getSafeErrorMessage(err);
    return res.status(statusCode).json({ message });
  }
}

/**
 * POST /api/login/session
 * Login with existing session ID
 */
async function handleLoginWithSessionId(req, res, next) {
  if (USE_MOCK_AUTH) {
    return res.status(200).json(getMockUserData());
  }

  let { session_id } = req.body;

  if (session_id) {
    session_id = session_id.replace(/['"]+/g, "").trim();
  }

  if (!session_id || !isValidSessionId(session_id)) {
    return res.status(400).json({
      message: "Το ID της συνεδρίας είναι απαραίτητο. Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    });
  }

  try {
    const response = await validateSession(session_id);

    if (response?.status === "error") {
      return res.status(401).json({ message: response.message });
    }

    return res.status(200).json({
      session_id,
      name: response.data.first_name_in_vocative,
      message: response.message || "Η συνεδρία επαληθεύτηκε επιτυχώς",
    });
  } catch (err) {
    const { isRateLimited, retryAfterMinutes } = handleRateLimitError(err);
    if (isRateLimited) {
      return res.status(429).json({
        message: `Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά σε ${retryAfterMinutes} λεπτά`,
      });
    }

    const statusCode = err.response?.status || 400;
    const message = getSafeErrorMessage(err);
    return res.status(statusCode).json({ message });
  }
}

// Route definitions
router.post("/", handleLoginWithEmail);
router.post("/session", handleLoginWithSessionId);

// Handle unsupported methods
router.all("/", (req, res) => {
  res.status(405).json({ message: "Method not allowed. Please use POST method." });
});

router.all("/session", (req, res) => {
  res.status(405).json({ message: "Method not allowed. Please use POST method." });
});

export default router;
