import type { Router } from "express";
import type { EfoodOrder, OrderAnalytics } from "./analyticsTypes.js";
export type * from "./analyticsTypes.js";

export interface AuthService {
  loginWithCredentials(email: string, password: string): Promise<unknown>;
  validateSession(sessionId: string): Promise<unknown>;
}

export interface OrderService {
  fetchAllOrders(sessionId: string): Promise<EfoodOrder[]>;
  analyzeOrders(orders: EfoodOrder[]): OrderAnalytics;
}

export type LoginResponse =
  | {
      status?: "ok";
      message: string;
      data: {
        session_id: string;
        user: {
          first_name_in_vocative: string;
        };
      };
    }
  | {
      status: "error";
      message: string;
      data?: never;
    };

export type SessionValidationResponse =
  | {
      status?: "ok";
      message?: string;
      data: {
        first_name_in_vocative: string;
      };
    }
  | {
      status: "error";
      message: string;
      data?: never;
    };

export interface MockUserData {
  session_id: string;
  name: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface ApiRouterOptions {
  loginRouter?: Router;
  ordersRouter?: Router;
}

export interface AppOptions {
  apiRouter?: Router;
}

export interface HttpErrorLike {
  message?: string;
  code?: string;
  status?: number;
  response?: {
    status?: number;
    headers?: Record<string, string | number | undefined>;
  };
}
