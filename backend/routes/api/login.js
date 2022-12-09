var router = require("express").Router();
const axios = require("axios");
async function getUserSession(logins) {
  const efood_url = "https://www.e-food.gr/users/login";
  const efood_headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  };
  const response = await axios.post(efood_url, logins, {
    headers: efood_headers,
  });
  return response;
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const response = await getUserSession({ email, password });

    if (response?.data?.status === "error") {
      return res.status(401).json({ message: response.data.message });
    } else {
      return res.status(200).json({
        session_id: response.data.data.session_id,
        name: response.data.data.user.first_name_in_vocative,
        message: response.data.message,
      });
    }
  } catch (err) {
    const statusCode = err.response.status;
    if (statusCode === 429) {
      const retryAfter = err.response.headers["retry-after"];
      const retryAfterInMinutes = Math.ceil(retryAfter / 60);
      return res.status(429).json({
        message: `Too many requests. Please try again in ${retryAfterInMinutes} minutes`,
      });
    }

    return res.status(400).json({ message: err.message });
  }
}
router.post("/", login);

module.exports = router;
