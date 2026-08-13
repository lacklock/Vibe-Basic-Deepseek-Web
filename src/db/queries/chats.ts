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

export type CreateMessageInput = Pick<NewMessage, "chatId" | "role" | "content"> & {
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

export async function createChat(input: CreateChatInput): Promise<Chat> {
  const [chat] = await db.insert(chatsTable).values(input).returning();

  if (!chat) {
    throw new Error("创建聊天失败。");
  }

  return chat;
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

async function requireOwnedChat(userId: Chat["userId"], chatId: Chat["chatId"]): Promise<void> {
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
