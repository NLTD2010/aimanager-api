import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import { authRoutes } from "./routes/auth";
import { chatRoutes } from "./routes/chat";
import { historyRoutes } from "./routes/history";
import { modelsRoutes } from "./routes/models";
import { docsRoutes } from "./routes/docs";

import { fail } from "./lib/response";
import { requireAuth } from "./utils/auth";
import type { AuthVars } from "./utils/auth";

export function createApp(){
  const app = new Hono<{ Variables: AuthVars }>();

  app.get("/health", (c) => c.json({ ok: true }));

  app.use("/openapi.yml", serveStatic({ path: "./public/openapi.yml" }));
  app.route("/docs", docsRoutes);

  app.route("/models", modelsRoutes);

  app.use("/auth/information", requireAuth);

  app.route("/auth", authRoutes);

  app.use("/chat/*", requireAuth);
  app.use("/history/*", requireAuth);

  app.route("/chat", chatRoutes);
  app.route("/history", historyRoutes);

  app.notFound((c) => fail(c, 404, "Route not found"));
  app.onError((error, c) => fail(c, 500, "Internal server error", error instanceof Error ? error.message : String(error)));

  return app;
}
