import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  toUIMessageStream,
} from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getOwnedMessageRole, requireOwnedChat, saveMessage } from "@/db/queries/chats";
import { withAuthenticatedRoute } from "@/lib/auth/require-user";
import { getUIMessageText } from "@/lib/chat-message";
import { logger } from "@/lib/logger";

const chatRequestSchema = z.object({
  id: z.uuid(),
  messages: z.unknown(),
  trigger: z.enum(["submit-message", "regenerate-message"]),
  messageId: z.uuid().optional(),
});

export const POST = withAuthenticatedRoute(async (req, claims) => {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求内容不是有效的 JSON。" }, { status: 400 });
  }

  const parsedRequest = chatRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return Response.json({ error: "请求参数无效。" }, { status: 400 });
  }

  const validation = await safeValidateUIMessages<UIMessage>({
    messages: parsedRequest.data.messages,
  });

  if (!validation.success || validation.data.length === 0) {
    return Response.json({ error: "消息格式无效。" }, { status: 400 });
  }

  const userId = claims.sub;
  const { id: chatId, trigger, messageId } = parsedRequest.data;

  try {
    await requireOwnedChat(userId, chatId);
  } catch (cause) {
    logger.warn({ err: cause, userId, chatId }, "拒绝访问不存在或不属于用户的会话");
    return Response.json({ error: "聊天不存在或无权访问。" }, { status: 404 });
  }

  if (trigger === "submit-message") {
    const userMessage = validation.data.at(-1);
    const parsedUserMessageId = z.uuid().safeParse(userMessage?.id);
    const content = userMessage ? getUIMessageText(userMessage.parts).trim() : "";

    if (
      !userMessage ||
      userMessage.role !== "user" ||
      !parsedUserMessageId.success ||
      content.length === 0
    ) {
      return Response.json({ error: "最后一条用户消息无效。" }, { status: 400 });
    }

    try {
      await saveMessage({
        userId,
        chatId,
        messageId: parsedUserMessageId.data,
        role: "user",
        content,
      });
    } catch (cause) {
      logger.error({ err: cause, userId, chatId }, "保存用户消息失败");
      return Response.json({ error: "保存消息失败，请稍后重试。" }, { status: 500 });
    }
  }

  const regeneratedMessageRole =
    trigger === "regenerate-message" && messageId
      ? await getOwnedMessageRole({ userId, chatId, messageId })
      : null;
  const responseMessageId =
    regeneratedMessageRole === "assistant" && messageId ? messageId : randomUUID();

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    messages: await convertToModelMessages(validation.data),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: validation.data,
      generateMessageId: () => responseMessageId,
      onError: (cause) => {
        logger.error({ err: cause, userId, chatId }, "生成聊天回复失败");
        return "生成回复失败，请稍后重试。";
      },
      onEnd: async ({ responseMessage }) => {
        const content = getUIMessageText(responseMessage.parts).trim();

        if (content.length === 0) {
          return;
        }

        try {
          await saveMessage({
            userId,
            chatId,
            messageId: responseMessage.id,
            role: "assistant",
            content,
          });
        } catch (cause) {
          logger.error({ err: cause, userId, chatId }, "保存助手消息失败");
          throw cause;
        }
      },
    }),
  });
});
