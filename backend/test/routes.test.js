import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp, createApiRouter } from "../app.js";
import { createLoginRouter } from "../routes/api/login.js";
import { createOrdersRouter } from "../routes/api/orders.js";

const validSessionId = "00000000-0000-0000-0000-000000000000";

function createTestApp({ authService, orderService } = {}) {
  return createApp({
    apiRouter: createApiRouter({
      loginRouter: createLoginRouter(authService),
      ordersRouter: createOrdersRouter(orderService),
    }),
  });
}

describe("api routes", () => {
  it("returns health status", async () => {
    await request(createApp()).get("/api/health").expect(200, { status: "ok" });
  });

  it("returns 404 for unknown endpoints", async () => {
    await request(createApp())
      .get("/not-found")
      .expect(404, { message: "Endpoint not found" });
  });
});

describe("login routes", () => {
  it("rejects invalid email and password requests before calling external services", async () => {
    const authService = {
      loginWithCredentials: vi.fn(),
      validateSession: vi.fn(),
    };
    const app = createTestApp({ authService });

    await request(app).post("/api/login").send({ email: "bad", password: "secret" }).expect(400);
    await request(app).post("/api/login").send({ email: "user@example.com", password: "short" }).expect(400);

    expect(authService.loginWithCredentials).not.toHaveBeenCalled();
  });

  it("maps successful credential login responses", async () => {
    const authService = {
      loginWithCredentials: vi.fn().mockResolvedValue({
        data: {
          session_id: validSessionId,
          user: { first_name_in_vocative: "Ilias" },
        },
        message: "ok",
      }),
      validateSession: vi.fn(),
    };

    await request(createTestApp({ authService }))
      .post("/api/login")
      .send({ email: " user@example.com ", password: "secret" })
      .expect(200, {
        session_id: validSessionId,
        name: "Ilias",
        message: "ok",
      });

    expect(authService.loginWithCredentials).toHaveBeenCalledWith("user@example.com", "secret");
  });

  it("maps e-food credential errors and rate limits", async () => {
    const authErrorApp = createTestApp({
      authService: {
        loginWithCredentials: vi.fn().mockResolvedValue({
          status: "error",
          message: "Invalid credentials",
        }),
        validateSession: vi.fn(),
      },
    });

    await request(authErrorApp)
      .post("/api/login")
      .send({ email: "user@example.com", password: "secret" })
      .expect(401, { message: "Invalid credentials" });

    const rateLimitApp = createTestApp({
      authService: {
        loginWithCredentials: vi.fn().mockRejectedValue({
          response: { status: 429, headers: { "retry-after": 120 } },
        }),
        validateSession: vi.fn(),
      },
    });

    const response = await request(rateLimitApp)
      .post("/api/login")
      .send({ email: "user@example.com", password: "secret" })
      .expect(429);

    expect(response.body.message).toContain("2 λεπτά");
  });

  it("sanitizes session IDs and maps validation responses", async () => {
    const authService = {
      loginWithCredentials: vi.fn(),
      validateSession: vi.fn().mockResolvedValue({
        data: { first_name_in_vocative: "Ilias" },
        message: "verified",
      }),
    };

    await request(createTestApp({ authService }))
      .post("/api/login/session")
      .send({ session_id: ` "${validSessionId}" ` })
      .expect(200, {
        session_id: validSessionId,
        name: "Ilias",
        message: "verified",
      });

    expect(authService.validateSession).toHaveBeenCalledWith(validSessionId);
  });

  it("rejects malformed session IDs and maps session rate limits", async () => {
    const authService = {
      loginWithCredentials: vi.fn(),
      validateSession: vi.fn(),
    };
    const app = createTestApp({ authService });

    await request(app).post("/api/login/session").send({ session_id: "bad" }).expect(400);
    expect(authService.validateSession).not.toHaveBeenCalled();

    const rateLimitApp = createTestApp({
      authService: {
        loginWithCredentials: vi.fn(),
        validateSession: vi.fn().mockRejectedValue({
          response: { status: 429, headers: { "retry-after": 60 } },
        }),
      },
    });

    const response = await request(rateLimitApp)
      .post("/api/login/session")
      .send({ session_id: validSessionId })
      .expect(429);

    expect(response.body.message).toContain("1 λεπτά");
  });
});

describe("orders routes", () => {
  it("rejects missing or malformed session IDs", async () => {
    const orderService = {
      fetchAllOrders: vi.fn(),
      analyzeOrders: vi.fn(),
    };
    const app = createTestApp({ orderService });

    await request(app).get("/api/orders").expect(400);
    await request(app).get("/api/orders").set("session_id", "bad").expect(400);

    expect(orderService.fetchAllOrders).not.toHaveBeenCalled();
  });

  it("returns analyzed orders from injected services", async () => {
    const rawOrders = [{ id: 1 }];
    const analyzedOrders = { all: { totalOrders: 1 }, perYear: [] };
    const orderService = {
      fetchAllOrders: vi.fn().mockResolvedValue(rawOrders),
      analyzeOrders: vi.fn().mockReturnValue(analyzedOrders),
    };

    await request(createTestApp({ orderService }))
      .get("/api/orders")
      .set("session_id", ` ${validSessionId} `)
      .expect(200, {
        orders: analyzedOrders,
        message: "Οι παραγγελίες ανακτήθηκαν επιτυχώς",
      });

    expect(orderService.fetchAllOrders).toHaveBeenCalledWith(validSessionId);
    expect(orderService.analyzeOrders).toHaveBeenCalledWith(rawOrders);
  });

  it("maps order rate limits and API failures", async () => {
    const rateLimitApp = createTestApp({
      orderService: {
        fetchAllOrders: vi.fn().mockRejectedValue({
          response: { status: 429, headers: { "retry-after": 180 } },
        }),
        analyzeOrders: vi.fn(),
      },
    });

    const rateLimitResponse = await request(rateLimitApp)
      .get("/api/orders")
      .set("session_id", validSessionId)
      .expect(429);

    expect(rateLimitResponse.body.message).toContain("3 λεπτά");

    const failureApp = createTestApp({
      orderService: {
        fetchAllOrders: vi.fn().mockRejectedValue({
          response: { status: 503 },
          message: "upstream down",
        }),
        analyzeOrders: vi.fn(),
      },
    });

    await request(failureApp)
      .get("/api/orders")
      .set("session_id", validSessionId)
      .expect(503, { message: "upstream down" });
  });

  it("returns 405 for unsupported route methods", async () => {
    const app = express();
    app.use("/orders", createOrdersRouter());

    await request(app)
      .post("/orders")
      .expect(405, { message: "Method not allowed. Please use GET method." });
  });
});
