import { afterEach, describe, expect, it } from "vitest";
import { isValidEmail, isValidSessionId, validatePassword } from "../constants/validation.js";
import {
  getErrorStatusCode,
  getSafeErrorMessage,
  handleRateLimitError,
  getRetryAfterSeconds,
} from "../utils/errorHandler.js";

describe("validation helpers", () => {
  it("validates session IDs and trims safe whitespace", () => {
    expect(isValidSessionId("00000000-0000-0000-0000-000000000000")).toBe(true);
    expect(isValidSessionId(" 00000000-0000-0000-0000-000000000000 ")).toBe(true);
    expect(isValidSessionId("not-a-session")).toBe(false);
    expect(isValidSessionId(null)).toBe(false);
  });

  it("validates email shape", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail(" user@example.com ")).toBe(true);
    expect(isValidEmail("bad-email")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  it("validates password presence and length", () => {
    expect(validatePassword("secret")).toEqual({ valid: true });
    expect(validatePassword("short")).toEqual({
      valid: false,
      message: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες",
    });
    expect(validatePassword("x".repeat(129))).toEqual({
      valid: false,
      message: "Ο κωδικός πρέπει να έχει λιγότερους από 128 χαρακτήρες",
    });
    expect(validatePassword("")).toEqual({
      valid: false,
      message: "Ο κωδικός είναι απαραίτητος",
    });
  });
});

describe("error helpers", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("hides error details in production", () => {
    process.env.NODE_ENV = "production";

    expect(getSafeErrorMessage(new Error("private"))).toBe(
      "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα."
    );
  });

  it("returns useful non-production errors and status codes", () => {
    process.env.NODE_ENV = "test";

    expect(getSafeErrorMessage(new Error("visible"))).toBe("visible");
    expect(getSafeErrorMessage(null)).toBe(
      "Προέκυψε ένα σφάλμα. Παρακαλώ δοκιμάστε ξανά αργότερα."
    );
    expect(getErrorStatusCode({ response: { status: 401 } })).toBe(401);
    expect(getErrorStatusCode({}, 500)).toBe(500);
  });

  it("detects rate-limit errors and rounds retry minutes up", () => {
    expect(
      handleRateLimitError({
        response: { status: 429, headers: { "retry-after": 61 } },
      })
    ).toEqual({ isRateLimited: true, retryAfterMinutes: 2 });
    expect(handleRateLimitError({ response: { status: 400 } })).toEqual({
      isRateLimited: false,
    });
  });

  it("handles HTTP-date Retry-After and maps network failures to gateway errors", () => {
    const now = Date.parse("2026-10-11T10:00:00Z");
    expect(getRetryAfterSeconds("Sun, 11 Oct 2026 10:02:01 GMT", now)).toBe(121);
    expect(getRetryAfterSeconds("invalid", now)).toBe(60);
    expect(getRetryAfterSeconds("0", now)).toBe(0);
    expect(getErrorStatusCode({ response: { status: 200 }, code: "ECONNABORTED" })).toBe(504);
    expect(getErrorStatusCode({ code: "ENOTFOUND" })).toBe(502);
    expect(getErrorStatusCode(new Error("Unexpected server failure"))).toBe(500);
  });
});
