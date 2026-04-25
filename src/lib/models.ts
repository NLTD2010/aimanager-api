import { config } from "../config";

export type ModelInfo = {
  model: string;
  description: string;
};

type HackClubModel = {
  id: string;
  description?: string;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
};

let cachedModels: { expiresAt: number; models: ModelInfo[] } | null = null;

export async function fetchTextModels(forceRefresh = false){
  const now = Date.now();
  if (!forceRefresh && cachedModels && cachedModels.expiresAt > now) return cachedModels.models;

  const response = await fetch(`${config.aiBaseUrl}/models`, {
    headers: config.aiApiKey ? { Authorization: `Bearer ${config.aiApiKey}` } : undefined
  });

  if (!response.ok) throw new Error(`Failed to fetch model catalog: ${response.status}`);

  const payload = (await response.json()) as { data?: HackClubModel[] };
  const models = (payload.data ?? [])
    .filter((model) => model.architecture?.modality === "text->text")
    .map((model) => ({
      model: model.id,
      description: model.description?.trim() || model.id
    }))
    .sort((left, right) => left.model.localeCompare(right.model));

  cachedModels = { expiresAt: now + config.modelCacheTtlMs, models };
  return models;
}

export async function resolveAllowedModel(requestedModel?: string | null){
  const models = await fetchTextModels();
  if (requestedModel){
    const match = models.find((model) => model.model === requestedModel);
    if (match) return match.model;
  }
  return models[0]?.model ?? "qwen/qwen3-32b";
}
