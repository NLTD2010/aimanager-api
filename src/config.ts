export type AppConfig = {
  port: number;
  databasePath: string;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
  aiBaseUrl: string;
  aiApiKey: string | null;
  modelCacheTtlMs: number;
};

const env = Bun.env;

export const config: AppConfig = {
  port: Number(env.PORT ?? 3000),
  databasePath: env.DATABASE_PATH ?? "./data/app.sqlite",
  jwtSecret: env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresInSeconds: Number(env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24),
  aiBaseUrl: env.AI_BASE_URL ?? "https://ai.hackclub.com/proxy/v1",
  aiApiKey: env.AI_API_KEY ?? null,
  modelCacheTtlMs: Number(env.MODEL_CACHE_TTL_MS ?? 5 * 60 * 1000)
};
