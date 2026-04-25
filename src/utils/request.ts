import type { Context } from "hono";

export function getClientIp(c: Context){
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

export function getBearerToken(c: Context){
  const authorization = c.req.header("authorization");
  if (!authorization?.startsWith("Bearer ")){
    return null;
  }
  return authorization.slice(7).trim() || null;
}