import express from "express";
const router = express.Router();
import axios from "axios";

function errorHandler(err, req, res, next) {
  const statusCode = err.response ? err.response.status : 400;
  if (statusCode === 429) {
    const retryAfter = err.response.headers["retry-after"];
    const retryAfterInMinutes = Math.ceil(retryAfter / 60);
    return res.status(429).json({
      message: `Too many requests. Please try again in ${retryAfterInMinutes} minutes`,
    });
  }
  return res.status(statusCode).json({ message: err.message });
}
function simulateDelay() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

async function postRequest(url, data, headers) {
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (err) {
    throw err;
  }
}

async function getRequest(url, headers) {
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (err) {
    throw err;
  }
}

async function getUserSessionWithEmail(logins) {
  const efoodUrl = "https://www.e-food.gr/users/login";
  const efoodHeaders = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
  };
  return postRequest(efoodUrl, logins, efoodHeaders);
}

async function getUserSessionWithID(sessionId) {
  const efoodUrl = "https://api.e-food.gr/api/v1/user/account";
  const efoodHeaders = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "x-core-session-id": sessionId,
  };

  return getRequest(efoodUrl, efoodHeaders);
}

async function loginWithEmail(req, res, next) {
  if (process.env.NODE_ENV === "development") {
    await simulateDelay();
    res.status(200).json({
      session_id: "123456789",
      name: "John",
      message: "Logged in successfully",
    });
    return;
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const response = await getUserSessionWithEmail({ email, password });

    if (response?.status === "error") {
      return res.status(401).json({ message: response.message });
    } else {
      return res.status(200).json({
        session_id: response.data.session_id,
        name: response.data.user.first_name_in_vocative,
        message: response.message,
      });
    }
  } catch (err) {
    next(err);
  }
}

async function loginWithSessionId(req, res, next) {
  if (process.env.NODE_ENV === "development") {
    await simulateDelay();
    res.status(200).json({
      session_id: "123456789",
      name: "John",
      message: "Logged in successfully",
    });
    return;
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ message: "Session ID is required" });
  }
  try {
    const response = await getUserSessionWithID(session_id);

    if (response?.status === "error") {
      return res.status(401).json({ message: response.message });
    }

    return res.status(200).json({
      session_id,
      name: response.data.first_name_in_vocative,
      message: response.data.message,
    });
  } catch (err) {
    next(err);
  }
}

router.post("/", loginWithEmail);

router.post("/session", loginWithSessionId);

router.all("/", (req, res) => {
  res
    .status(405)
    .json({ message: "Method not allowed. Please use POST method." });
});

export default router;
