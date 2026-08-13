"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createChatAction } from "@/app/(chat)/actions";
import { ChatComposer } from "@/components/chat/chat-composer";
import { encodePendingChatMessage, getPendingChatKey } from "@/lib/chat-handoff";

export function HomeChatStarter() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string>();

  async function startChat() {
    const message = input.trim();

    if (!message || isNavigating) {
      return;
    }

    setError(undefined);
    setIsNavigating(true);

    const messageId = crypto.randomUUID();
    let result: Awaited<ReturnType<typeof createChatAction>>;

    try {
      result = await createChatAction({ messageId, content: message });
    } catch {
      setError("创建会话失败，请稍后重试。");
      setIsNavigating(false);
      return;
    }

    if (result.status === "error") {
      setError(result.message);
      setIsNavigating(false);
      return;
    }

    try {
      sessionStorage.setItem(
        getPendingChatKey(result.chatId),
        encodePendingChatMessage({ messageId: result.messageId, content: message }),
      );
    } catch {
      // 会话和首条消息已经保存；目标页面允许用户手动生成回复。
    }

    router.push(`/chat/${result.chatId}`);
  }

  return (
    <div className="w-full">
      <ChatComposer
        id="home-composer"
        ariaLabel="发送给 Deepseek"
        placeholder="给 Deepseek 发消息…"
        variant="home"
        value={input}
        onValueChange={setInput}
        onSubmit={startChat}
        disabled={isNavigating}
      />
      {error ? (
        <p className="mt-2 px-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
