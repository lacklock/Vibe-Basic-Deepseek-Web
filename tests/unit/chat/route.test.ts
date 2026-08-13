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
const toUIMessageStream = mock.fn((options: unknown) => {
  void options;
  return "ui-stream";
});
const createUIMessageStreamResponse = mock.fn(() => new Response("streamed"));
const deepseek = mock.fn((model: string) => model);
const requireOwnedChat = mock.fn(async () => undefined);
const getOwnedMessageRole = mock.fn(async (): Promise<string | null> => null);
const saveMessage = mock.fn(async (input: Record<string, unknown>) => input);

mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({ auth: { getClaims } }),
  },
});
mock.module("@ai-sdk/deepseek", {
  namedExports: { deepseek },
});
mock.module("@/db/queries/chats", {
  namedExports: {
    getOwnedMessageRole,
    requireOwnedChat,
    saveMessage,
  },
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
  requireOwnedChat.mock.resetCalls();
  getOwnedMessageRole.mock.resetCalls();
  saveMessage.mock.resetCalls();
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
      body: JSON.stringify({
        id: "25203985-6ff8-45b6-a560-75bf9f56d327",
        messages: [{ role: "unknown" }],
        trigger: "submit-message",
      }),
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(streamText.mock.callCount(), 0);
});

test("拒绝访问不属于当前用户的会话", async () => {
  requireOwnedChat.mock.mockImplementationOnce(async () => {
    throw new Error("not found");
  });
  const messages = [
    {
      id: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
      role: "user",
      parts: [{ type: "text", text: "你好" }],
    },
  ];
  validationResult = { success: true, data: messages };

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        id: "25203985-6ff8-45b6-a560-75bf9f56d327",
        messages,
        trigger: "submit-message",
      }),
    }),
  );

  assert.equal(response.status, 404);
  assert.equal(saveMessage.mock.callCount(), 0);
  assert.equal(streamText.mock.callCount(), 0);
});

test("用户消息保存失败时不调用模型", async () => {
  saveMessage.mock.mockImplementationOnce(async () => {
    throw new Error("database unavailable");
  });
  const messages = [
    {
      id: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
      role: "user",
      parts: [{ type: "text", text: "你好" }],
    },
  ];
  validationResult = { success: true, data: messages };

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        id: "25203985-6ff8-45b6-a560-75bf9f56d327",
        messages,
        trigger: "submit-message",
      }),
    }),
  );

  assert.equal(response.status, 500);
  assert.equal(streamText.mock.callCount(), 0);
});

test("合法消息使用 Deepseek 并返回 UI Message 流", async () => {
  const chatId = "25203985-6ff8-45b6-a560-75bf9f56d327";
  const messages = [
    {
      id: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
      role: "user",
      parts: [{ type: "text", text: "你好" }],
    },
  ];
  validationResult = { success: true, data: messages };

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        id: chatId,
        messages,
        trigger: "submit-message",
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(requireOwnedChat.mock.calls[0]?.arguments, ["user-123", chatId]);
  assert.deepEqual(saveMessage.mock.calls[0]?.arguments, [
    {
      userId: "user-123",
      chatId,
      messageId: messages[0]?.id,
      role: "user",
      content: "你好",
    },
  ]);
  assert.deepEqual(deepseek.mock.calls[0]?.arguments, ["deepseek-v4-flash"]);
  assert.deepEqual(convertToModelMessages.mock.calls[0]?.arguments, [messages]);
  const streamOptions = toUIMessageStream.mock.calls[0]?.arguments[0] as {
    stream: unknown;
    originalMessages: unknown[];
  };
  assert.equal(streamOptions.stream, "model-stream");
  assert.equal(streamOptions.originalMessages, messages);
  assert.deepEqual(createUIMessageStreamResponse.mock.calls[0]?.arguments, [
    { stream: "ui-stream" },
  ]);
});

test("流结束后保存助手消息", async () => {
  const chatId = "25203985-6ff8-45b6-a560-75bf9f56d327";
  const messages = [
    {
      id: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
      role: "user",
      parts: [{ type: "text", text: "你好" }],
    },
  ];
  validationResult = { success: true, data: messages };

  await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ id: chatId, messages, trigger: "submit-message" }),
    }),
  );

  const streamOptions = toUIMessageStream.mock.calls[0]?.arguments[0] as {
    generateMessageId: () => string;
    onEnd: (event: { responseMessage: (typeof messages)[number] }) => Promise<void>;
  };
  const assistantMessageId = streamOptions.generateMessageId();

  await streamOptions.onEnd({
    responseMessage: {
      id: assistantMessageId,
      role: "assistant",
      parts: [{ type: "text", text: "  你好，有什么可以帮你？  " }],
    },
  });

  assert.deepEqual(saveMessage.mock.calls[1]?.arguments, [
    {
      userId: "user-123",
      chatId,
      messageId: assistantMessageId,
      role: "assistant",
      content: "你好，有什么可以帮你？",
    },
  ]);
});

test("重新生成时复用原助手消息 id", async () => {
  const chatId = "25203985-6ff8-45b6-a560-75bf9f56d327";
  const assistantMessageId = "99999999-6ff8-45b6-a560-75bf9f56d327";
  const messages = [
    {
      id: "07678a7e-b32a-4369-87a9-2f62bf24bb75",
      role: "user",
      parts: [{ type: "text", text: "换个回答" }],
    },
  ];
  validationResult = { success: true, data: messages };
  getOwnedMessageRole.mock.mockImplementationOnce(async () => "assistant");

  await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        id: chatId,
        messages,
        trigger: "regenerate-message",
        messageId: assistantMessageId,
      }),
    }),
  );

  const streamOptions = toUIMessageStream.mock.calls[0]?.arguments[0] as {
    generateMessageId: () => string;
  };

  assert.equal(streamOptions.generateMessageId(), assistantMessageId);
  assert.equal(saveMessage.mock.callCount(), 0);
});
