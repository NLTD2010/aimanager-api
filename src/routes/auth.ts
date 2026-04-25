import { Hono } from "hono";

import { config } from "../config";
import { createUser, findUserByIdentifier, findUserById, updateLastLogin } from "../lib/database";
import { authRateLimit } from "../lib/rateLimit";
import { fail, nowIso, ok, trimText } from "../lib/response";
import { hashPassword, signJwt, verifyJwt, verifyPassword } from "../lib/security";
import { AuthVars, requireAuth } from "../utils/auth";
import { getBearerToken, getClientIp } from "../utils/request";

export const authRoutes = new Hono<{ Variables: AuthVars }>();

// ===== rate limit middleware =====

authRoutes.use("/*", async (c, next) => {
  const key = `chat:${getClientIp(c)}:userid:${c.get("userId")}`;
  const result = authRateLimit(key);

  if (!result.allowed) return fail(c, 429, "Please slow down dude, too many auth requests");

  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.resetAt));

  await next();
});

// ===== register =====

authRoutes.post("/register", async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const username = trimText(body?.username);
  const email = trimText(body?.email).toLowerCase();
  const password = trimText(body?.password);

  if (!username || !email || !password) return fail(c, 400, "username, email, and password are required");

  if (findUserByIdentifier(username) || findUserByIdentifier(email)){
    return fail(c, 409, "Bro… this username/email is already in use");
  }

  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const passwordHash = await hashPassword(password);

  createUser({
    id,
    username,
    email,
    passwordHash,
    createdAt
  });

  return ok(
    c,
    {
      id,
      username,
      email,
      created_at: createdAt
    },
    201
  );
});

// ===== login =====

authRoutes.post("/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;

  const identifier = trimText(body?.username || body?.email);
  const password = trimText(body?.password);

  if (!identifier || !password) return fail(c, 400, "Bro, where's the username/email and password?");

  const user = findUserByIdentifier(identifier);
  if (!user) return fail(c, 401, "Invalid credentials");

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return fail(c, 401, "Invalid credentials");

  const token = signJwt(
    {
      sub: user.id,
      username: user.username,
      email: user.email || ""
    },
    config.jwtSecret,
    config.jwtExpiresInSeconds
  );

  const lastLogin = nowIso();
  updateLastLogin(user.id, lastLogin);

  return ok(c, {
    token,
    token_type: "Bearer",
    expires_in: config.jwtExpiresInSeconds,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      last_login: lastLogin,
      created_at: user.created_at
    }
  });
});

// ===== information =====

authRoutes.get("/information", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const user = findUserById(userId);

  if (!user) return fail(c, 404, "Who are you?");

  return ok(c, {
    username: user.username,
    email: user.email,
    last_login: user.last_login,
    created_at: user.created_at
  });
});

authRoutes.all("/register", (c) => {
  c.header("Allow", "POST");
  return fail(c, 405, "Use another method dude");
});

authRoutes.all("/login", (c) => {
  c.header("Allow", "POST");
  return fail(c, 405, "Use another method dude");
});

authRoutes.all("/information", (c) => {
  c.header("Allow", "GET");
  return fail(c, 405, "Use another method dude");
});