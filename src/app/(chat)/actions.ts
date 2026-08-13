"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createChatWithFirstMessage } from "@/db/queries/chats";
import { requireUser } from "@/lib/auth/require-user";
import { logger } from "@/lib/logger";

const createChatSchema = z.object({
  messageId: z.uuid(),
  content: z.string().trim().min(1),
});

export type CreateChatActionResult =
  | {
      status: "success";
      chatId: string;
      messageId: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function createChatAction(input: unknown): Promise<CreateChatActionResult> {
  const parsedInput = createChatSchema.safeParse(input);

  if (!parsedInput.success) {
    return { status: "error", message: "消息格式不正确。" };
  }

  const { sub: userId } = await requireUser();

  try {
    const { chat, message } = await createChatWithFirstMessage({
      userId,
      messageId: parsedInput.data.messageId,
      content: parsedInput.data.content,
    });

    revalidatePath("/", "layout");

    return {
      status: "success",
      chatId: chat.chatId,
      messageId: message.messageId,
    };
  } catch (cause) {
    logger.error({ err: cause, userId }, "创建会话失败");
    return { status: "error", message: "创建会话失败，请稍后重试。" };
  }
}
