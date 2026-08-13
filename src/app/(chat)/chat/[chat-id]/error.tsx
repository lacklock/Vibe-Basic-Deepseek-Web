"use client";

import { Button } from "@/components/ui/button";

export default function ChatError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex h-full items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">无法加载会话</h1>
        <p className="text-sm text-muted-foreground">读取聊天记录失败，请稍后重试。</p>
        <Button type="button" onClick={reset}>
          重新加载
        </Button>
      </div>
    </main>
  );
}
