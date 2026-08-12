"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

import { MessageResponse } from "@/components/ai-elements/message";
import { ChatComposer } from "@/components/chat/chat-composer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPendingChatKey } from "@/lib/chat-handoff";
import { cn } from "@/lib/utils";

type ChatConversationProps = {
  chatId: string;
};

function getMessageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function ChatConversation({ chatId }: ChatConversationProps) {
  const [input, setInput] = useState("");
  const [handoffError, setHandoffError] = useState<string>();
  const didSendPendingMessage = useRef(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, regenerate, status, error } = useChat({ id: chatId });
  const isBusy = status === "submitted" || status === "streaming";
  const lastMessage = messages.at(-1);
  const hasStreamingResponse =
    lastMessage?.role === "assistant" && getMessageText(lastMessage.parts).trim().length > 0;
  const responseStatus =
    status === "submitted"
      ? "正在等待 DeepSeek 响应…"
      : status === "streaming" && !hasStreamingResponse
        ? "DeepSeek 正在思考…"
        : null;
  const firstUserMessage = messages.find((message) => message.role === "user");
  const title = firstUserMessage
    ? getMessageText(firstUserMessage.parts).slice(0, 48) || "当前会话"
    : "当前会话";

  useEffect(() => {
    if (didSendPendingMessage.current) {
      return;
    }

    didSendPendingMessage.current = true;

    try {
      const pendingChatKey = getPendingChatKey(chatId);
      const pendingMessage = sessionStorage.getItem(pendingChatKey);

      if (!pendingMessage) {
        return;
      }

      sessionStorage.removeItem(pendingChatKey);
      void sendMessage({ text: pendingMessage });
    } catch {
      queueMicrotask(() => {
        setHandoffError("无法读取首条消息，请返回首页重新创建会话。");
      });
    }
  }, [chatId, sendMessage]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  function submitMessage() {
    const message = input.trim();

    if (!message || isBusy || status === "error") {
      return;
    }

    setInput("");
    void sendMessage({ text: message });
  }

  function retryLastMessage() {
    void regenerate();
  }

  return (
    <main className="grid h-full min-h-0 grid-rows-[56px_minmax(0,1fr)_auto] bg-background">
      <header className="flex items-center border-b border-border/70 px-14 md:px-6">
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </header>

      <ScrollArea className="min-h-0">
        <section
          className="mx-auto flex min-h-full w-full max-w-202 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"
          aria-label="对话内容"
          aria-live="polite"
        >
          {messages.length === 0 && status === "ready" ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              输入消息开始新的对话
            </div>
          ) : null}

          {messages.map((message, messageIndex) => {
            const hasText = getMessageText(message.parts).trim().length > 0;

            if (!hasText) {
              return null;
            }

            return (
              <article
                key={message.id}
                className={cn("flex", message.role === "user" && "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-full text-[15px] leading-7 sm:text-base",
                    message.role === "user"
                      ? "max-w-[82%] rounded-2xl bg-primary px-4 py-2.5 whitespace-pre-wrap text-primary-foreground sm:max-w-[70%]"
                      : "w-full px-1 text-foreground",
                  )}
                >
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      message.role === "assistant" ? (
                        <MessageResponse
                          key={`${message.id}-${index}`}
                          animated
                          isAnimating={
                            status === "streaming" && messageIndex === messages.length - 1
                          }
                        >
                          {part.text}
                        </MessageResponse>
                      ) : (
                        <span key={`${message.id}-${index}`}>{part.text}</span>
                      )
                    ) : null,
                  )}
                </div>
              </article>
            );
          })}

          {responseStatus ? (
            <p className="px-1 text-sm text-muted-foreground" role="status">
              {responseStatus}
            </p>
          ) : null}

          <div ref={endOfMessagesRef} aria-hidden="true" />
        </section>
      </ScrollArea>

      <footer className="bg-background px-3 pt-2 pb-3 sm:px-6 sm:pb-5">
        <div className="mx-auto w-full max-w-190">
          {handoffError || error ? (
            <div
              className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <span>{handoffError ?? "消息发送失败，请稍后重试。"}</span>
              {error && messages.length > 0 ? (
                <Button type="button" size="sm" variant="destructive" onClick={retryLastMessage}>
                  重试
                </Button>
              ) : null}
            </div>
          ) : null}
          <ChatComposer
            id="chat-composer"
            ariaLabel="继续给 Deepseek 发消息"
            placeholder="继续给 Deepseek 发消息…"
            variant="chat"
            value={input}
            onValueChange={setInput}
            onSubmit={submitMessage}
            disabled={status !== "ready"}
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground max-sm:hidden">
            AI 生成的内容可能存在错误，请核查重要信息。
          </p>
        </div>
      </footer>
    </main>
  );
}
