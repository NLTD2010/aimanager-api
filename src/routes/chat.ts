import { Hono } from "hono";
import { addTurn, createChat, findChatById, listTurns, updateChatHeader, updateChatModel } from "../lib/database";
import { callModel } from "../lib/ai";
import { chatRateLimit } from "../lib/rateLimit";
import { fail, nowIso, ok, trimText } from "../lib/response";
import { resolveAllowedModel } from "../lib/models";
import type { AuthVars } from "../utils/auth";
import { getClientIp } from "../utils/request";

export const chatRoutes = new Hono<{ Variables: AuthVars }>();

chatRoutes.use("/*", async (c, next) => {
  const key = `chat:${getClientIp(c)}:userid:${c.get("userId")}`;
  const result = chatRateLimit(key);
  if (!result.allowed) return fail(c, 429, "Please slow down dude, too many auth requests");

  c.header("X-RateLimit-Remaining", String(result.remaining));
  c.header("X-RateLimit-Reset", String(result.resetAt));
  
  await next();
});

chatRoutes.post("/", async (c) => {
  const userId = c.get("userId");
  if (!userId) return fail(c, 401, "Unauthorized");

  const body = await c.req.json().catch(() => null) as Record<string, unknown> | null;
  const message = trimText(body?.message);
  const requestedChatId = trimText(body?.chat_id);
  const requestedModel = trimText(body?.model);

  if (!message) return fail(c, 400, "Please say something, message can't be empty");

  const model = await resolveAllowedModel(requestedModel || null);
  const timestamp = nowIso();

  let chatId = requestedChatId;
  let chat = requestedChatId ? findChatById(requestedChatId, userId) : null;

  if (requestedChatId && !chat) return fail(c, 404, "Chat not found");

  if (!chat){
    chatId = crypto.randomUUID();
    createChat({
      id: chatId,
      userId,
      header: message.slice(0, 80),
      model,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    chat = findChatById(chatId, userId);
  }

  if (!chat || !chatId) return fail(c, 500, "Unable to create chat");


  if (requestedModel && requestedModel !== chat.model) updateChatModel(chatId, userId, model, timestamp);

  const history = listTurns(chatId);
  const messages = [
    { role: "system" as const, content: "You are a helpful assistant." },
    ...history.flatMap((turn) => [
      { role: "user" as const, content: turn.question },
      { role: "assistant" as const, content: turn.response }
    ]),
    { role: "user" as const, content: message }
  ];

  const responseText = await callModel(model, messages);
  addTurn({
    chatId,
    question: message,
    response: responseText,
    createdAt: timestamp
  });

  if (!requestedChatId && history.length === 0) updateChatHeader(chatId, userId, message.slice(0, 80), timestamp);

  return ok(c, {
    response: responseText,
    chat_id: chatId,
    created_at: timestamp
  });
});
