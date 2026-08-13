import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ChatNotFound() {
  return (
    <main className="flex h-full items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">找不到这个会话</h1>
        <p className="text-sm text-muted-foreground">会话不存在，或者你无权访问它。</p>
        <Button render={<Link href="/" />} nativeButton={false}>
          开启新会话
        </Button>
      </div>
    </main>
  );
}
