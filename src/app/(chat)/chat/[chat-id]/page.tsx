import type { Metadata } from "next";

import { ChatConversation } from "@/components/chat/chat-conversation";

type ChatPageProps = {
  params: Promise<{ "chat-id": string }>;
};

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
  await params;

  return { title: "当前会话 · Vibe Chat" };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { "chat-id": chatId } = await params;

  return <ChatConversation chatId={chatId} />;
}
