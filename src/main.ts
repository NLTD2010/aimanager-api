import { config } from "./config";
import { getDatabase } from "./lib/database";
import { createApp } from "./app";

getDatabase();

const app = createApp();

Bun.serve({
  port: config.port,
  fetch: app.fetch
});

console.log(`AImanager running on http://localhost:${config.port}`);
