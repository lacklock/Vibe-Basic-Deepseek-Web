import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

let claimsResult: {
  data: { claims?: { sub?: string } } | null;
  error: Error | null;
} = {
  data: { claims: { sub: "user-123" } },
  error: null,
};
let validationResult: { success: true; data: unknown[] } | { success: false; error: Error } = {
  success: true,
  data: [],
};

const getClaims = mock.fn(async () => claimsResult);
const safeValidateUIMessages = mock.fn(async () => validationResult);
const convertToModelMessages = mock.fn(async (messages: unknown[]) => messages);
const streamText = mock.fn(() => ({ stream: "model-stream" }));
const toUIMessageStream = mock.fn(() => "ui-stream");
const createUIMessageStreamResponse = mock.fn(() => new Response("streamed"));
const deepseek = mock.fn((model: string) => model);

mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({ auth: { getClaims } }),
  },
});
mock.module("@ai-sdk/deepseek", {
  namedExports: { deepseek },
});
mock.module("ai", {
  namedExports: {
    convertToModelMessages,
    createUIMessageStreamResponse,
    safeValidateUIMessages,
    streamText,
    toUIMessageStream,
  },
});

let POST: typeof import("@/app/api/chat/route").POST;

before(async () => {
  ({ POST } = await import("@/app/api/chat/route"));
});

beforeEach(() => {
  claimsResult = {
    data: { claims: { sub: "user-123" } },
    error: null,
  };
  validationResult = { success: true, data: [] };
  getClaims.mock.resetCalls();
  safeValidateUIMessages.mock.resetCalls();
  convertToModelMessages.mock.resetCalls();
  streamText.mock.resetCalls();
  toUIMessageStream.mock.resetCalls();
  createUIMessageStreamResponse.mock.resetCalls();
  deepseek.mock.resetCalls();
});

test("未登录时拒绝调用聊天模型", async () => {
  claimsResult = { data: null, error: new Error("unauthorized") };

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    }),
  );

  assert.equal(response.status, 401);
  assert.equal(streamText.mock.callCount(), 0);
});

test("拒绝无效 JSON", async () => {
  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: "not-json",
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(safeValidateUIMessages.mock.callCount(), 0);
});

test("拒绝不符合 UIMessage 结构的消息", async () => {
  validationResult = { success: false, error: new Error("invalid messages") };

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "unknown" }] }),
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(streamText.mock.callCount(), 0);
});

test("合法消息使用 Deepseek 并返回 UI Message 流", async () => {
  const messages = [
    {
      id: "message-1",
      role: "user",
      parts: [{ type: "text", text: "你好" }],
    },
  ];
  validationResult = { success: true, data: messages };

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(deepseek.mock.calls[0]?.arguments, ["deepseek-v4-flash"]);
  assert.deepEqual(convertToModelMessages.mock.calls[0]?.arguments, [messages]);
  assert.deepEqual(toUIMessageStream.mock.calls[0]?.arguments, [{ stream: "model-stream" }]);
  assert.deepEqual(createUIMessageStreamResponse.mock.calls[0]?.arguments, [
    { stream: "ui-stream" },
  ]);
});
