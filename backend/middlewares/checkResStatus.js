/**
 * Middleware to check response status from previous middleware/handlers
 */
export default function checkResStatus(req, res, next) {
  if (res?.data?.status === "error") {
    return res.status(400).json({ message: res.data.message || "Η αίτηση απέτυχε" });
  }
  next();
}
