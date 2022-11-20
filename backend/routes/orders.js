const axios = require("axios");

async function getUserOrders(session_id, offset) {
  const orders_url = `https://api.e-food.gr/api/v1/user/orders/history?limit=100&offset=${offset}&mode=extended`;
  const orders_headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "x-core-session-id": session_id,
  };
  const response = await axios.get(orders_url, { headers: orders_headers });
  return response;
}

async function orders(req, res) {
  const { session_id, offset = 0 } = req.headers;
  if (!session_id) {
    return res.status(400).json({ message: "Session ID is required" });
  }
  try {
    const response = await getUserOrders(session_id, offset);
    if (response?.data?.status === "error") {
      return res.status(400).json({ message: response.data.message });
    } else {
      return res.status(200).json({
        orders: response.data.data.orders,
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

module.exports = orders;
