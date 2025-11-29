import { isValidSessionId } from "../constants/validation.js";

/**
 * Middleware to validate session ID presence and format
 * Session ID must be a valid UUID: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
export default function checkSession(req, res, next) {
  try {
    const sessionId = req.headers.session_id;

    if (!sessionId) {
      return res.status(400).json({ message: "Το ID της συνεδρίας είναι απαραίτητο. Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" });
    }

    if (!isValidSessionId(sessionId)) {
      return res.status(400).json({
        message: "Το ID της συνεδρίας είναι σε λανθασμένο format. Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
      });
    }

    req.headers.session_id = sessionId.trim();
    next();
  } catch (err) {
    res.status(401).json({ message: "Authentication error" });
  }
}
