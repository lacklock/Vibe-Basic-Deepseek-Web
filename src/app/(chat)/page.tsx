import { Brand } from "@/components/chat/brand";
import { ChatComposer } from "@/components/chat/chat-composer";

export default function HomePage() {
  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center border-b border-border/70 px-14 md:hidden">
        <Brand />
      </header>
      <section className="flex min-h-0 flex-1 items-center justify-center px-4 pb-14 sm:px-8">
        <div className="flex w-full max-w-[680px] -translate-y-[3vh] flex-col items-center gap-7">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              开始和 Deepseek 聊天
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              提出问题、梳理想法，或从一段草稿开始。
            </p>
          </div>
          <ChatComposer
            id="home-composer"
            ariaLabel="发送给 Deepseek"
            placeholder="给 Deepseek 发消息…"
            variant="home"
          />
        </div>
      </section>
    </main>
  );
}
