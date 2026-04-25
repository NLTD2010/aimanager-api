import { Hono } from "hono";
import { findChatById, listChats, listTurns, searchChatsByHeader } from "../lib/database";
import { fail, ok, trimText } from "../lib/response";
import type { AuthVars } from "../utils/auth";

export const historyRoutes = new Hono<{ Variables: AuthVars }>();

historyRoutes.get("/", (c) => {
  const userId = c.get("userId");
  if (!userId) return fail(c, 401, "Unauthorized");

  const chats = listChats(userId).map((chat) => ({
    id: chat.id,
    header: chat.header,
    created_at: chat.created_at
  }));

  return ok(c, chats);
});

historyRoutes.get("/search", (c) => {
  const userId = c.get("userId");
  if (!userId) return fail(c, 401, "Unauthorized");

  const query = trimText(c.req.query("query"));
  if (!query) return ok(c, []);

  const chats = searchChatsByHeader(userId, query).map((chat) => ({
    id: chat.id,
    header: chat.header,
    created_at: chat.created_at
  }));

  return ok(c, chats);
});

historyRoutes.get("/:id", (c) => {
  const userId = c.get("userId");
  if (!userId) return fail(c, 401, "Unauthorized");

  const chatId = c.req.param("id");
  const chat = findChatById(chatId, userId);
  if (!chat) return fail(c, 404, "Chat not found");

  const turns = listTurns(chatId).map((turn) => ({
    id: `${chatId}-${turn.turn_index}`,
    question: turn.question,
    response: turn.response,
    created_at: turn.created_at
  }));

  return ok(c, turns);
});
