import type { MiddlewareHandler } from "hono";
import { config } from "../config";
import { fail } from "../lib/response";
import { verifyJwt } from "../lib/security";
import { getBearerToken } from "./request";

export type AuthVars = {
  userId?: string;
};

export const requireAuth: MiddlewareHandler<{ Variables: AuthVars }> = async (c, next) => {
  const token = getBearerToken(c);
  if (!token) return fail(c, 401, "Where is your bearer token");

  const payload = await verifyJwt(token, config.jwtSecret);
  if (!payload) return fail(c, 401, "Invalid or expired token");

  c.set("userId", payload.sub);
  await next();
};