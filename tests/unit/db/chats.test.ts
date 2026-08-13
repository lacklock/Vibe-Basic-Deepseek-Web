import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

let selectedBatches: unknown[][] = [];
let insertedBatches: unknown[][] = [];
let updatedBatches: unknown[][] = [];

const returning = mock.fn(async () => insertedBatches.shift() ?? []);
const onConflictDoNothing = mock.fn(() => ({ returning }));
const values = mock.fn((input: unknown) => {
  void input;
  return { onConflictDoNothing, returning };
});
const insert = mock.fn(() => ({ values }));
const updateReturning = mock.fn(async () => updatedBatches.shift() ?? []);
const updateWhere = mock.fn(() => ({ returning: updateReturning }));
const set = mock.fn(() => ({ where: updateWhere }));
const update = mock.fn(() => ({ set }));
const transaction = mock.fn(async (callback: (tx: { insert: typeof insert }) => unknown) =>
  callback({ insert }),
);
const limit = mock.fn(async () => selectedBatches.shift() ?? []);
const orderBy = mock.fn(() => ({ limit }));
const where = mock.fn(() => ({ limit, orderBy }));
const from = mock.fn(() => ({ where }));
const select = mock.fn(() => ({ from }));

mock.module("@/db", {
  namedExports: {
    db: { insert, select, transaction, update },
  },
});

let ChatNotFoundError: typeof import("@/db/queries/chats").ChatNotFoundError;
let MessageConflictError: typeof import("@/db/queries/chats").MessageConflictError;
let createChat: typeof import("@/db/queries/chats").createChat;
let createChatWithFirstMessage: typeof import("@/db/queries/chats").createChatWithFirstMessage;
let createMessage: typeof import("@/db/queries/chats").createMessage;
let getOwnedMessageRole: typeof import("@/db/queries/chats").getOwnedMessageRole;
let listChatsByUser: typeof import("@/db/queries/chats").listChatsByUser;
let listMessagesByChat: typeof import("@/db/queries/chats").listMessagesByChat;
let saveMessage: typeof import("@/db/queries/chats").saveMessage;

before(async () => {
  ({
    ChatNotFoundError,
    MessageConflictError,
    createChat,
    createChatWithFirstMessage,
    createMessage,
    getOwnedMessageRole,
    listChatsByUser,
    listMessagesByChat,
    saveMessage,
  } = await import("@/db/queries/chats"));
});

beforeEach(() => {
  selectedBatches = [];
  insertedBatches = [];
  updatedBatches = [];
  returning.mock.resetCalls();
  values.mock.resetCalls();
  insert.mock.resetCalls();
  onConflictDoNothing.mock.resetCalls();
  updateReturning.mock.resetCalls();
  updateWhere.mock.resetCalls();
  set.mock.resetCalls();
  update.mock.resetCalls();
  limit.mock.resetCalls();
  orderBy.mock.resetCalls();
  where.mock.resetCalls();
  from.mock.resetCalls();
  select.mock.resetCalls();
  transaction.mock.resetCalls();
});

test("createChat inserts and returns the created chat", async () => {
  const chat = {
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
    title: "新对话",
    createdAt: new Date(),
  };
  insertedBatches = [[chat]];

  const result = await createChat({ userId: chat.userId, title: chat.title });

  assert.equal(result, chat);
  assert.deepEqual(values.mock.calls[0]?.arguments, [
    { userId: chat.userId, title: chat.title },
  ]);
});

test("createChatWithFirstMessage creates the chat and first message in one transaction", async () => {
  const chat = {
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
    title: "请帮我设计一个数据库持久化方案",
    createdAt: new Date(),
  };
  const message = {
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    chatId: chat.chatId,
    role: "user",
    content: "请帮我设计一个数据库持久化方案",
    createdAt: new Date(),
  };
  insertedBatches = [[chat], [message]];

  const result = await createChatWithFirstMessage({
    userId: chat.userId,
    messageId: message.messageId,
    content: message.content,
  });

  assert.deepEqual(result, { chat, message });
  assert.equal(transaction.mock.callCount(), 1);
  assert.deepEqual(values.mock.calls.map((call) => call.arguments[0]), [
    { userId: chat.userId, title: chat.title },
    {
      messageId: message.messageId,
      chatId: chat.chatId,
      role: "user",
      content: message.content,
    },
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
  insertedBatches = [[message]];

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

test("saveMessage updates an existing message with the same chat and role", async () => {
  const userId = "61551570-9fb8-41b4-b358-fbed67501ac9";
  const message = {
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    role: "assistant",
    content: "更新后的回答",
    createdAt: new Date(),
  };
  selectedBatches = [
    [{ chatId: message.chatId }],
    [{ chatId: message.chatId, role: message.role }],
  ];
  insertedBatches = [[]];
  updatedBatches = [[message]];

  const result = await saveMessage({
    userId,
    messageId: message.messageId,
    chatId: message.chatId,
    role: message.role,
    content: message.content,
  });

  assert.equal(result, message);
  assert.equal(onConflictDoNothing.mock.callCount(), 1);
  assert.deepEqual(set.mock.calls[0]?.arguments, [{ content: message.content }]);
  assert.equal(updateWhere.mock.callCount(), 1);
});

test("saveMessage inserts a message when its id is new", async () => {
  const userId = "61551570-9fb8-41b4-b358-fbed67501ac9";
  const message = {
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    role: "user",
    content: "你好",
    createdAt: new Date(),
  };
  selectedBatches = [[{ chatId: message.chatId }]];
  insertedBatches = [[message]];

  const result = await saveMessage({ userId, ...message });

  assert.equal(result, message);
  assert.equal(update.mock.callCount(), 0);
});

test("saveMessage rejects a message id owned by another chat", async () => {
  const chatId = "25203985-6ff8-45b6-a560-75bf9f56d327";
  selectedBatches = [
    [{ chatId }],
    [{ chatId: "99999999-6ff8-45b6-a560-75bf9f56d327", role: "assistant" }],
  ];
  insertedBatches = [[]];

  await assert.rejects(
    saveMessage({
      userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
      messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
      chatId,
      role: "assistant",
      content: "不能覆盖其他会话的消息",
    }),
    MessageConflictError,
  );

  assert.equal(update.mock.callCount(), 0);
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

test("getOwnedMessageRole only returns a role from the owned chat", async () => {
  const userId = "61551570-9fb8-41b4-b358-fbed67501ac9";
  const chatId = "25203985-6ff8-45b6-a560-75bf9f56d327";
  selectedBatches = [[{ chatId }], [{ role: "assistant" }]];

  const result = await getOwnedMessageRole({
    userId,
    chatId,
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
  });

  assert.equal(result, "assistant");
  assert.deepEqual(limit.mock.calls.map((call) => call.arguments), [[1], [1]]);
});
