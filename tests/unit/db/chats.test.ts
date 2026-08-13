import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

let selectedRows: unknown[] = [];
let insertedRows: unknown[] = [];

const returning = mock.fn(async () => insertedRows);
const values = mock.fn(() => ({ returning }));
const insert = mock.fn(() => ({ values }));
const limit = mock.fn(async () => selectedRows);
const where = mock.fn(() => ({ limit }));
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

before(async () => {
  ({ ChatNotFoundError, createChat, createMessage } = await import("@/db/queries/chats"));
});

beforeEach(() => {
  selectedRows = [];
  insertedRows = [];
  returning.mock.resetCalls();
  values.mock.resetCalls();
  insert.mock.resetCalls();
  limit.mock.resetCalls();
  where.mock.resetCalls();
  from.mock.resetCalls();
  select.mock.resetCalls();
});

test("createChat inserts and returns the created chat", async () => {
  const chat = {
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
    title: "新对话",
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
  selectedRows = [{ chatId: message.chatId }];
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
