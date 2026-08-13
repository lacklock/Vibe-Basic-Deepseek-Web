import { and, desc, eq, lt, or } from "drizzle-orm";

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

export type CreateChatWithFirstMessageInput = {
  userId: Chat["userId"];
  messageId: Message["messageId"];
  content: Message["content"];
};

export type CreateMessageInput = Pick<NewMessage, "chatId" | "role" | "content"> & {
  userId: Chat["userId"];
};

export type SaveMessageInput = {
  messageId: Message["messageId"];
  chatId: Message["chatId"];
  role: Message["role"];
  content: Message["content"];
  userId: Chat["userId"];
};

export type ChatCursor = Pick<Chat, "createdAt" | "chatId">;
export type MessageCursor = Pick<Message, "createdAt" | "messageId">;

export type ListChatsByUserInput = {
  userId: Chat["userId"];
  limit?: number;
  cursor?: ChatCursor;
};

export type ListMessagesByChatInput = {
  userId: Chat["userId"];
  chatId: Chat["chatId"];
  limit?: number;
  cursor?: MessageCursor;
};

export type PaginatedResult<TItem, TCursor> = {
  items: TItem[];
  nextCursor: TCursor | null;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export class ChatNotFoundError extends Error {
  constructor() {
    super("聊天不存在或无权访问。");
    this.name = "ChatNotFoundError";
  }
}

export class MessageConflictError extends Error {
  constructor() {
    super("消息 ID 已被其他消息占用。");
    this.name = "MessageConflictError";
  }
}

export async function createChat(input: CreateChatInput): Promise<Chat> {
  const [chat] = await db.insert(chatsTable).values(input).returning();

  if (!chat) {
    throw new Error("创建聊天失败。");
  }

  return chat;
}

export async function createChatWithFirstMessage({
  userId,
  messageId,
  content,
}: CreateChatWithFirstMessageInput): Promise<{ chat: Chat; message: Message }> {
  return db.transaction(async (tx) => {
    const [chat] = await tx
      .insert(chatsTable)
      .values({ userId, title: content.slice(0, 48) })
      .returning();

    if (!chat) {
      throw new Error("创建聊天失败。");
    }

    const [message] = await tx
      .insert(messagesTable)
      .values({
        messageId,
        chatId: chat.chatId,
        role: "user",
        content,
      })
      .returning();

    if (!message) {
      throw new Error("创建首条消息失败。");
    }

    return { chat, message };
  });
}

export async function listChatsByUser({
  userId,
  limit,
  cursor,
}: ListChatsByUserInput): Promise<PaginatedResult<Chat, ChatCursor>> {
  const pageSize = normalizePageSize(limit);
  const rows = await db
    .select()
    .from(chatsTable)
    .where(
      and(
        eq(chatsTable.userId, userId),
        cursor
          ? or(
              lt(chatsTable.createdAt, cursor.createdAt),
              and(
                eq(chatsTable.createdAt, cursor.createdAt),
                lt(chatsTable.chatId, cursor.chatId),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(chatsTable.createdAt), desc(chatsTable.chatId))
    .limit(pageSize + 1);

  return toPaginatedResult(rows, pageSize, ({ createdAt, chatId }) => ({
    createdAt,
    chatId,
  }));
}

export async function createMessage({
  userId,
  ...messageInput
}: CreateMessageInput): Promise<Message> {
  await requireOwnedChat(userId, messageInput.chatId);

  const [message] = await db.insert(messagesTable).values(messageInput).returning();

  if (!message) {
    throw new Error("创建消息失败。");
  }

  return message;
}

export async function saveMessage({
  userId,
  ...messageInput
}: SaveMessageInput): Promise<Message> {
  await requireOwnedChat(userId, messageInput.chatId);

  const [insertedMessage] = await db
    .insert(messagesTable)
    .values(messageInput)
    .onConflictDoNothing({ target: messagesTable.messageId })
    .returning();

  if (insertedMessage) {
    return insertedMessage;
  }

  const [existingMessage] = await db
    .select({
      chatId: messagesTable.chatId,
      role: messagesTable.role,
    })
    .from(messagesTable)
    .where(eq(messagesTable.messageId, messageInput.messageId))
    .limit(1);

  if (
    !existingMessage ||
    existingMessage.chatId !== messageInput.chatId ||
    existingMessage.role !== messageInput.role
  ) {
    throw new MessageConflictError();
  }

  const [updatedMessage] = await db
    .update(messagesTable)
    .set({ content: messageInput.content })
    .where(
      and(
        eq(messagesTable.messageId, messageInput.messageId),
        eq(messagesTable.chatId, messageInput.chatId),
        eq(messagesTable.role, messageInput.role),
      ),
    )
    .returning();

  if (!updatedMessage) {
    throw new Error("保存消息失败。");
  }

  return updatedMessage;
}

export async function listMessagesByChat({
  userId,
  chatId,
  limit,
  cursor,
}: ListMessagesByChatInput): Promise<PaginatedResult<Message, MessageCursor>> {
  await requireOwnedChat(userId, chatId);

  const pageSize = normalizePageSize(limit);
  const rows = await db
    .select()
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.chatId, chatId),
        cursor
          ? or(
              lt(messagesTable.createdAt, cursor.createdAt),
              and(
                eq(messagesTable.createdAt, cursor.createdAt),
                lt(messagesTable.messageId, cursor.messageId),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(messagesTable.createdAt), desc(messagesTable.messageId))
    .limit(pageSize + 1);

  return toPaginatedResult(rows, pageSize, ({ createdAt, messageId }) => ({
    createdAt,
    messageId,
  }));
}

export async function getOwnedMessageRole({
  userId,
  chatId,
  messageId,
}: {
  userId: Chat["userId"];
  chatId: Chat["chatId"];
  messageId: Message["messageId"];
}): Promise<Message["role"] | null> {
  await requireOwnedChat(userId, chatId);

  const [message] = await db
    .select({ role: messagesTable.role })
    .from(messagesTable)
    .where(and(eq(messagesTable.messageId, messageId), eq(messagesTable.chatId, chatId)))
    .limit(1);

  return message?.role ?? null;
}

export async function requireOwnedChat(
  userId: Chat["userId"],
  chatId: Chat["chatId"],
): Promise<void> {
  const [chat] = await db
    .select({ chatId: chatsTable.chatId })
    .from(chatsTable)
    .where(and(eq(chatsTable.chatId, chatId), eq(chatsTable.userId, userId)))
    .limit(1);

  if (!chat) {
    throw new ChatNotFoundError();
  }
}

function normalizePageSize(limit = DEFAULT_PAGE_SIZE): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGE_SIZE);
}

function toPaginatedResult<TItem, TCursor>(
  rows: TItem[],
  pageSize: number,
  getCursor: (item: TItem) => TCursor,
): PaginatedResult<TItem, TCursor> {
  if (rows.length <= pageSize) {
    return { items: rows, nextCursor: null };
  }

  const items = rows.slice(0, pageSize);
  const lastItem = items[items.length - 1];

  return {
    items,
    nextCursor: lastItem ? getCursor(lastItem) : null,
  };
}
