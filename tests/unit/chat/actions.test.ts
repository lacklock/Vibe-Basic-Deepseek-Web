import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

const revalidatePath = mock.fn();
let claimsResult: {
  data: { claims?: { sub?: string } } | null;
  error: Error | null;
} = {
  data: { claims: { sub: "61551570-9fb8-41b4-b358-fbed67501ac9" } },
  error: null,
};
const getClaims = mock.fn(async () => claimsResult);
const createChatWithFirstMessage = mock.fn(async () => ({
  chat: {
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
    title: "你好",
    createdAt: new Date(),
  },
  message: {
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    role: "user",
    content: "你好",
    createdAt: new Date(),
  },
}));

mock.module("next/cache", {
  namedExports: { revalidatePath },
});
mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({ auth: { getClaims } }),
  },
});
mock.module("@/db/queries/chats", {
  namedExports: { createChatWithFirstMessage },
});

let createChatAction: typeof import("@/app/(chat)/actions").createChatAction;

before(async () => {
  ({ createChatAction } = await import("@/app/(chat)/actions"));
});

beforeEach(() => {
  claimsResult = {
    data: { claims: { sub: "61551570-9fb8-41b4-b358-fbed67501ac9" } },
    error: null,
  };
  revalidatePath.mock.resetCalls();
  getClaims.mock.resetCalls();
  createChatWithFirstMessage.mock.resetCalls();
});

test("createChatAction rejects invalid input before reading the session", async () => {
  const result = await createChatAction({ messageId: "not-a-uuid", content: "   " });

  assert.deepEqual(result, { status: "error", message: "消息格式不正确。" });
  assert.equal(getClaims.mock.callCount(), 0);
  assert.equal(createChatWithFirstMessage.mock.callCount(), 0);
});

test("createChatAction rejects an expired session", async () => {
  claimsResult = { data: null, error: new Error("expired") };

  const result = await createChatAction({
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    content: "你好",
  });

  assert.deepEqual(result, {
    status: "error",
    message: "登录状态已失效，请重新登录。",
  });
  assert.equal(createChatWithFirstMessage.mock.callCount(), 0);
});

test("createChatAction saves the first message and revalidates the chat layout", async () => {
  const input = {
    messageId: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
    content: "  你好  ",
  };

  const result = await createChatAction(input);

  assert.deepEqual(createChatWithFirstMessage.mock.calls[0]?.arguments, [
    {
      userId: "61551570-9fb8-41b4-b358-fbed67501ac9",
      messageId: input.messageId,
      content: "你好",
    },
  ]);
  assert.deepEqual(revalidatePath.mock.calls[0]?.arguments, ["/", "layout"]);
  assert.deepEqual(result, {
    status: "success",
    chatId: "25203985-6ff8-45b6-a560-75bf9f56d327",
    messageId: input.messageId,
  });
});
