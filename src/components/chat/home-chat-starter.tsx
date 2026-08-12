"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { getPendingChatKey } from "@/lib/chat-handoff";

export function HomeChatStarter() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string>();

  function startChat() {
    const message = input.trim();

    if (!message || isNavigating) {
      return;
    }

    setError(undefined);
    setIsNavigating(true);

    try {
      const chatId = crypto.randomUUID();
      sessionStorage.setItem(getPendingChatKey(chatId), message);
      router.push(`/chat/${chatId}`);
    } catch {
      setError("无法创建会话，请检查浏览器存储权限后重试。");
      setIsNavigating(false);
    }
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
