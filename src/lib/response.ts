import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200){
  return c.json(data, status);
}

export function fail(c: Context, status: ContentfulStatusCode, message: string, details?: unknown){
  return c.json(
    {
      error: message,
      details: details ?? null
    },
    status
  );
}

export function nowIso(){
  return new Date().toISOString();
}

export function trimText(value: unknown){
  return typeof value === "string" ? value.trim() : "";
}
