import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

let selectedBatches: unknown[][] = [];
let insertedRows: unknown[] = [];

const returning = mock.fn(async () => insertedRows);
const values = mock.fn(() => ({ returning }));
const insert = mock.fn(() => ({ values }));
const limit = mock.fn(async () => selectedBatches.shift() ?? []);
const orderBy = mock.fn(() => ({ limit }));
const where = mock.fn(() => ({ limit, orderBy }));
const from = mock.fn(() => ({ where }));
const select = mock.fn(() => ({ from }));

mock.module("@/db", {
  namedExports: {
    db: { insert, select },
  },
});

let ChatNotFoundError: typeof import("@/db/queries/chats").ChatNotFoundError;
let createChat: typeof import("@/db/queries/chats").createChat;
let createMessage: typeof import("@/db/queries/chats").createMessage;
let listChatsByUser: typeof import("@/db/queries/chats").listChatsByUser;
let listMessagesByChat: typeof import("@/db/queries/chats").listMessagesByChat;

before(async () => {
  ({ ChatNotFoundError, createChat, createMessage, listChatsByUser, listMessagesByChat } =
    await import("@/db/queries/chats"));
});

beforeEach(() => {
  selectedBatches = [];
  insertedRows = [];
  returning.mock.resetCalls();
  values.mock.resetCalls();
  insert.mock.resetCalls();
  limit.mock.resetCalls();
  orderBy.mock.resetCalls();
  where.mock.resetCalls();
  from.mock.resetCalls();
  select.mock.resetCalls();
});

test("createChat inserts and returns the created chat", async () => {
  const chat = {
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
    title: "新对话",
    createdAt: new Date(),
  };
  insertedRows = [chat];

  const result = await createChat({ userId: chat.userId, title: chat.title });

  assert.equal(result, chat);
  assert.deepEqual(values.mock.calls[0]?.arguments, [
    { userId: chat.userId, title: chat.title },
  ]);
});

test("createMessage rejects a chat that does not belong to the user", async () => {
  await assert.rejects(
    createMessage({
      userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
      chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
      role: "user",
      content: "你好",
    }),
    ChatNotFoundError,
  );

  assert.equal(select.mock.callCount(), 1);
  assert.equal(insert.mock.callCount(), 0);
});

test("createMessage inserts and returns a message after checking ownership", async () => {
  const message = {
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    role: "user",
    content: "你好",
    createdAt: new Date(),
  };
  selectedBatches = [[{ chatId: message.chatId }]];
  insertedRows = [message];

  const result = await createMessage({
    userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
    chatId: message.chatId,
    role: message.role,
    content: message.content,
  });

  assert.equal(result, message);
  assert.deepEqual(values.mock.calls[0]?.arguments, [
    {
      chatId: message.chatId,
      role: message.role,
      content: message.content,
    },
  ]);
});

test("listChatsByUser returns a cursor when another page exists", async () => {
  const userId = "61551570-9fb8-41b4-b358-fbed67501ac9";
  const chats = [
    {
      chatId: "30000000-0000-0000-0000-000000000000",
      userId,
      title: "第三个对话",
      createdAt: new Date("2026-08-13T03:00:00.000Z"),
    },
    {
      chatId: "20000000-0000-0000-0000-000000000000",
      userId,
      title: "第二个对话",
      createdAt: new Date("2026-08-13T02:00:00.000Z"),
    },
    {
      chatId: "10000000-0000-0000-0000-000000000000",
      userId,
      title: "第一个对话",
      createdAt: new Date("2026-08-13T01:00:00.000Z"),
    },
  ];
  selectedBatches = [chats];

  const result = await listChatsByUser({ userId, limit: 2 });

  assert.deepEqual(result, {
    items: chats.slice(0, 2),
    nextCursor: {
      createdAt: chats[1]?.createdAt,
      chatId: chats[1]?.chatId,
    },
  });
  assert.deepEqual(limit.mock.calls[0]?.arguments, [3]);
  assert.equal(orderBy.mock.callCount(), 1);
});

test("listMessagesByChat checks ownership and returns the final page", async () => {
  const userId = "61551570-9fb8-41b4-b358-fbed67501ac9";
  const chatId = "25203985-6ff8-45b6-a560-75bf9f56d327";
  const messages = [
    {
      messageId: "20000000-0000-0000-0000-000000000000",
      chatId,
      role: "assistant",
      content: "你好，有什么可以帮你？",
      createdAt: new Date("2026-08-13T02:00:00.000Z"),
    },
    {
      messageId: "10000000-0000-0000-0000-000000000000",
      chatId,
      role: "user",
      content: "你好",
      createdAt: new Date("2026-08-13T01:00:00.000Z"),
    },
  ];
  selectedBatches = [[{ chatId }], messages];

  const result = await listMessagesByChat({ userId, chatId, limit: 20 });

  assert.deepEqual(result, {
    items: messages,
    nextCursor: null,
  });
  assert.deepEqual(limit.mock.calls.map((call) => call.arguments), [[1], [21]]);
  assert.equal(orderBy.mock.callCount(), 1);
});
