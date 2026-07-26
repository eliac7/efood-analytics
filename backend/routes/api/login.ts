import express from "express";
import type { Request, Response, Router } from "express";
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
  getErrorStatusCode,
  getSafeErrorMessage,
  handleRateLimitError,
} from "../../utils/errorHandler.js";
import type { AuthService } from "../../types.js";

const USE_MOCK_AUTH = process.env.MOCK_AUTH === "true" && process.env.NODE_ENV === "development";

interface LoginWithEmailBody {
  email?: unknown;
  password?: unknown;
}

interface LoginWithSessionBody {
  session_id?: unknown;
}

/**
 * POST /api/login
 * Login with email and password
 */
async function handleLoginWithEmail(
  req: Request<object, object, LoginWithEmailBody>,
  res: Response,
  authService: AuthService
): Promise<Response> {
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
    const response = await authService.loginWithCredentials(email.trim(), password as string);

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
    const rateLimit = handleRateLimitError(err);
    if (rateLimit.isRateLimited) {
      return res.status(429).json({
        message: `Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά σε ${rateLimit.retryAfterMinutes} λεπτά`,
      });
    }

    // Handle other errors
    const statusCode = getErrorStatusCode(err);
    const message = getSafeErrorMessage(err);
    return res.status(statusCode).json({ message });
  }
}

/**
 * POST /api/login/session
 * Login with existing session ID
 */
async function handleLoginWithSessionId(
  req: Request<object, object, LoginWithSessionBody>,
  res: Response,
  authService: AuthService
): Promise<Response> {
  if (USE_MOCK_AUTH) {
    return res.status(200).json(getMockUserData());
  }

  let { session_id } = req.body;

  if (typeof session_id === "string") {
    session_id = session_id.replace(/['"]+/g, "").trim();
  }

  if (!session_id || !isValidSessionId(session_id)) {
    return res.status(400).json({
      message: "Το ID της συνεδρίας είναι απαραίτητο. Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    });
  }

  try {
    const response = await authService.validateSession(session_id);

    if (response?.status === "error") {
      return res.status(401).json({ message: response.message });
    }

    return res.status(200).json({
      session_id,
      name: response.data.first_name_in_vocative,
      message: response.message || "Η συνεδρία επαληθεύτηκε επιτυχώς",
    });
  } catch (err) {
    const rateLimit = handleRateLimitError(err);
    if (rateLimit.isRateLimited) {
      return res.status(429).json({
        message: `Πάρα πολλές αιτήσεις. Παρακαλώ δοκιμάστε ξανά σε ${rateLimit.retryAfterMinutes} λεπτά`,
      });
    }

    const statusCode = getErrorStatusCode(err);
    const message = getSafeErrorMessage(err);
    return res.status(statusCode).json({ message });
  }
}

export function createLoginRouter(
  authService: AuthService = { loginWithCredentials, validateSession }
): Router {
  const router = express.Router();

  // Route definitions
  router.post("/", (req, res) => handleLoginWithEmail(req, res, authService));
  router.post("/session", (req, res) =>
    handleLoginWithSessionId(req, res, authService)
  );

  // Handle unsupported methods
  router.all("/", (req, res) => {
    res.status(405).json({ message: "Method not allowed. Please use POST method." });
  });

  router.all("/session", (req, res) => {
    res.status(405).json({ message: "Method not allowed. Please use POST method." });
  });

  return router;
}

const router = createLoginRouter();
export default router;
