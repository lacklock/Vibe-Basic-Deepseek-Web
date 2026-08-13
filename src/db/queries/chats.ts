import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  chatsTable,
  messagesTable,
  type Chat,
  type Message,
  type NewChat,
  type NewMessage,
} from "@/db/schema";

export type CreateChatInput = Pick<NewChat, "userId" | "title">;

export type CreateMessageInput = Pick<NewMessage, "chatId" | "role" | "content"> & {
  userId: Chat["userId"];
};

export class ChatNotFoundError extends Error {
  constructor() {
    super("聊天不存在或无权访问。");
    this.name = "ChatNotFoundError";
  }
}

export async function createChat(input: CreateChatInput): Promise<Chat> {
  const [chat] = await db.insert(chatsTable).values(input).returning();

  if (!chat) {
    throw new Error("创建聊天失败。");
  }

  return chat;
}

export async function createMessage({
  userId,
  ...messageInput
}: CreateMessageInput): Promise<Message> {
  const [chat] = await db
    .select({ chatId: chatsTable.chatId })
    .from(chatsTable)
    .where(and(eq(chatsTable.chatId, messageInput.chatId), eq(chatsTable.userId, userId)))
    .limit(1);

  if (!chat) {
    throw new ChatNotFoundError();
  }

  const [message] = await db.insert(messagesTable).values(messageInput).returning();

  if (!message) {
    throw new Error("创建消息失败。");
  }

  return message;
}
