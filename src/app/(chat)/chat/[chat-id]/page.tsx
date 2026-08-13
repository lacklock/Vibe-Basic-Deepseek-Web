import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { UIMessage } from "ai";
import { z } from "zod";

import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatNotFoundError, listMessagesByChat } from "@/db/queries/chats";
import { requireUser } from "@/lib/auth/require-user";

type ChatPageProps = {
  params: Promise<{ "chat-id": string }>;
};

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
  await params;

  return { title: "当前会话 · Vibe Chat" };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { "chat-id": chatId } = await params;

  if (!z.uuid().safeParse(chatId).success) {
    notFound();
  }

  const claims = await requireUser();

  let messages;

  try {
    ({ items: messages } = await listMessagesByChat({
      userId: claims.sub,
      chatId,
      limit: 100,
    }));
  } catch (error) {
    if (error instanceof ChatNotFoundError) {
      notFound();
    }

    throw error;
  }

  const initialMessages: UIMessage[] = messages
    .toReversed()
    .flatMap((message) =>
      message.role === "user" || message.role === "assistant"
        ? [
            {
              id: message.messageId,
              role: message.role,
              parts: [{ type: "text" as const, text: message.content }],
            },
          ]
        : [],
    );

  return <ChatConversation chatId={chatId} initialMessages={initialMessages} />;
}
