module.exports = function checkSession(req, res, next) {
  try {
    const session_id = req.headers.session_id;
    if (!session_id) {
      return res.status(400).json({ message: "Session ID is required" });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: "Something went wrong" });
  }
};
