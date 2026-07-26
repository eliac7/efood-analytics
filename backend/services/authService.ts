import axios from "axios";
import type { LoginResponse, MockUserData, SessionValidationResponse } from "../types.js";

const EFOOD_BASE_URL = "https://api.e-food.gr/api/v1";
const EFOOD_LOGIN_URL = "https://www.e-food.gr/users/login";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
};

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - E-food API response
 */
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    EFOOD_LOGIN_URL,
    { email, password },
    { headers: DEFAULT_HEADERS }
  );
  return response.data;
}

/**
 * Validate and get user info using session ID
 * @param {string} sessionId - E-food session ID
 * @returns {Promise<Object>} - E-food API response
 */
export async function validateSession(sessionId: string): Promise<SessionValidationResponse> {
  const response = await axios.get<SessionValidationResponse>(`${EFOOD_BASE_URL}/user/account`, {
    headers: {
      ...DEFAULT_HEADERS,
      "x-core-session-id": sessionId,
    },
  });
  return response.data;
}

/**
 * Get mock user data for development
 * @returns {Object} - Mock user data
 */
export function getMockUserData(): MockUserData {
  return {
    session_id: "00000000-0000-0000-0000-000000000000",
    name: "Test User",
    message: "Logged in successfully (dev mode)",
  };
}

