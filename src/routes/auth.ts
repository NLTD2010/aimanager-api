import { Hono, Context } from "hono";
import { createHash, randomUUID } from "node:crypto";

import { config } from "../config";
import {
  clearActivePasswordResetTokens,
  createPasswordResetToken,
  createUser,
  findActivePasswordResetToken,
  findUserById,
  findUserByIdentifier,
  markPasswordResetTokensUsed,
  updateLastLogin,
  updateUserPassword
} from "../lib/database";
import { sendResetPasswordEmail } from "../lib/email";
import { authRateLimit } from "../lib/rateLimit";
import { fail, nowIso, ok, trimText } from "../lib/response";
import { hashPassword, signJwt, verifyPassword } from "../lib/security";
import { AuthVars, requireAuth } from "../utils/auth";
import { getClientIp } from "../utils/request";

export const authRoutes = new Hono<{ Variables: AuthVars }>();

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function parseBody(c: Context) {
  return (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
}

// ===== rate limit =====

authRoutes.use("/*", async (c, next) => {
  const key = `ip:${getClientIp(c)}:userid:${c.get("userId")}`;
  const result = authRateLimit(key);

  if (!result.allowed) {
    return fail(c, 429, "Easy there dude, too many auth requests");
  }

  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.resetAt));

  await next();
});

// ===== register =====

authRoutes.post("/register", async (c) => {
  const body = await parseBody(c);

  const username = trimText(body?.username);
  const email = trimText(body?.email)?.toLowerCase();
  const password = trimText(body?.password);

  if (!username || !email || !password) {
    return fail(c, 400, "Yo dude, username, email, and password are required");
  }

  if (findUserByIdentifier(username) || findUserByIdentifier(email)) {
    return fail(c, 409, "That username or email is already taken dude");
  }

  const id = randomUUID();
  const createdAt = nowIso();
  const passwordHash = await hashPassword(password);

  createUser({
    id,
    username,
    email,
    passwordHash,
    createdAt
  });

  return ok(c, {
    id,
    username,
    email,
    created_at: createdAt
  }, 201);
});

// ===== login =====

authRoutes.post("/login", async (c) => {
  const body = await parseBody(c);

  const identifier = trimText(body?.username || body?.email);
  const password = trimText(body?.password);

  if (!identifier || !password) {
    return fail(c, 400, "Yo, username/email and password are required");
  }

  const user = findUserByIdentifier(identifier);

  if (!user) {
    return fail(c, 401, "Nah, those credentials ain't valid");
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    return fail(c, 401, "Nah, those credentials ain't valid");
  }

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
  const userId = c.get("userId");
  const user = findUserById(userId!);

  if (!user) {
    return fail(c, 404, "Who even are you?");
  }

  return ok(c, {
    username: user.username,
    email: user.email,
    last_login: user.last_login,
    created_at: user.created_at
  });
});

// ===== forgot password =====

authRoutes.post("/forgot-password", async (c) => {
  const body = await parseBody(c);

  const email = trimText(body?.email)?.toLowerCase();

  if (!email) {
    return fail(c, 400, "Yo, email is required");
  }

  const user = findUserByIdentifier(email);

  if (user) {
    const resetToken = randomUUID().replaceAll("-", "");
    const tokenHash = createHash("sha256").update(resetToken).digest("hex");

    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS).toISOString();

    clearActivePasswordResetTokens(user.id);

    createPasswordResetToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      createdAt,
      expiresAt
    });

    const baseUrl = new URL(c.req.url).origin;
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    try {
      await sendResetPasswordEmail(email, resetLink);
    } catch (error) {
      console.error("Failed to send reset password email", error);
    }
  }

  return ok(c, {
    message: "If that email exists, a reset link is heading its way dude"
  });
});

// ===== reset password =====

authRoutes.post("/reset-password", async (c) => {
  const body = await parseBody(c);

  const token = trimText(body?.token);
  const password = trimText(body?.password ?? body?.new_password);

  if (!token || !password) {
    return fail(c, 400, "Yo, token and password are required");
  }

  const now = nowIso();
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const matchedToken = findActivePasswordResetToken(tokenHash, now);

  if (!matchedToken) {
    return fail(c, 400, "That reset token is invalid or expired dude");
  }

  const passwordHash = await hashPassword(password);

  updateUserPassword(matchedToken.user_id, passwordHash);
  markPasswordResetTokensUsed(matchedToken.user_id, now);

  return ok(c, {
    message: "Boom!, password reset successful"
  });
});

// ===== method guards =====

authRoutes.all("/register", (c) => {
  c.header("Allow", "POST");
  return fail(c, 405, "Wrong move dude, use POST");
});

authRoutes.all("/login", (c) => {
  c.header("Allow", "POST");
  return fail(c, 405, "Wrong move dude, use POST");
});

authRoutes.all("/information", (c) => {
  c.header("Allow", "GET");
  return fail(c, 405, "Wrong move dude, use GET");
});

authRoutes.all("/forgot-password", (c) => {
  c.header("Allow", "POST");
  return fail(c, 405, "Wrong move dude, use POST");
});

authRoutes.all("/reset-password", (c) => {
  c.header("Allow", "POST");
  return fail(c, 405, "Wrong move dude, use POST");
});