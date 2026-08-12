import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { requireUser } from "@/lib/auth/require-user";
import { logger } from "@/lib/logger";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "个人资料 | Vibe Chat",
};

export default async function ProfilePage() {
  const claims = await requireUser();
  const userId = claims.sub as string;
  let nickname = "";

  try {
    const [profile] = await db
      .select({ nickname: usersTable.nickname })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    nickname = profile?.nickname ?? "";
  } catch (error) {
    logger.error({ err: error, userId }, "读取用户资料失败");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <section className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        >
          ← 返回首页
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          个人资料
        </h1>
        <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
          设置一个昵称，让之后的对话更有个人感。
        </p>

        <ProfileForm nickname={nickname} />
      </section>
    </main>
  );
}
