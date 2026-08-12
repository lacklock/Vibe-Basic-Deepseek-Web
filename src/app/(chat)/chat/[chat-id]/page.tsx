import type { Metadata } from "next";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { demoMessages, getDemoChat } from "@/lib/chat-demo";
import { cn } from "@/lib/utils";

type ChatPageProps = {
  params: Promise<{ "chat-id": string }>;
};

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
  const { "chat-id": chatId } = await params;
  const title = getDemoChat(chatId)?.title ?? "当前会话";

  return { title: `${title} · Vibe Chat` };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { "chat-id": chatId } = await params;
  const title = getDemoChat(chatId)?.title ?? "当前会话";

  return (
    <main className="grid h-full min-h-0 grid-rows-[56px_minmax(0,1fr)_auto] bg-background">
      <header className="flex items-center border-b border-border/70 px-14 md:px-6">
        <h1 className="truncate text-sm font-medium">{title}</h1>
      </header>

      <ScrollArea className="min-h-0">
        <section
          className="mx-auto flex w-full max-w-[808px] flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"
          aria-label="对话内容"
          aria-live="polite"
        >
          {demoMessages.map((message) => (
            <article
              key={message.id}
              className={cn("flex", message.role === "user" && "justify-end")}
            >
              <div
                className={cn(
                  "max-w-full text-[15px] leading-7 sm:text-base",
                  message.role === "user"
                    ? "max-w-[82%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground sm:max-w-[70%]"
                    : "flex w-full flex-col gap-4 px-1 text-foreground",
                )}
              >
                <p>{message.content}</p>
                {message.items ? (
                  <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">
                    {message.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </ScrollArea>

      <footer className="bg-background px-3 pt-2 pb-3 sm:px-6 sm:pb-5">
        <div className="mx-auto w-full max-w-[760px]">
          <ChatComposer
            id="chat-composer"
            ariaLabel="继续给 Deepseek 发消息"
            placeholder="继续给 Deepseek 发消息…"
            variant="chat"
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground max-sm:hidden">
            AI 生成的内容可能存在错误，请核查重要信息。
          </p>
        </div>
      </footer>
    </main>
  );
}
