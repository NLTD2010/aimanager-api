import { Hono } from "hono";
import { fetchTextModels } from "../lib/models";
import { fail } from "../lib/response";

export const modelsRoutes = new Hono();

modelsRoutes.get("/", async (c) => {
  try {
    const models = await fetchTextModels();
    return c.json(models);
  } catch (error){
    return fail(c, 502, "Failed to load models", error instanceof Error ? error.message : String(error));
  }
});
