import { config } from "../config";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callModel(model: string, messages: ChatMessage[]){
  const response = await fetch(`${config.aiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.aiApiKey ? { Authorization: `Bearer ${config.aiApiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5
    })
  });

  if (!response.ok){
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}
