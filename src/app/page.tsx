import { logoutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/require-user";

export default async function Home() {
  const claims = await requireUser();
  const email = typeof claims.email === "string" ? claims.email : "已登录用户";

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <section className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Vibe Chat</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          登录成功
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-300">{email}</p>
        <p className="mt-6 leading-7 text-zinc-600 dark:text-zinc-400">
          认证模块已经工作。接下来可以在这里接入聊天界面。
        </p>

        <form action={logoutAction} className="mt-8">
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            退出登录
          </button>
        </form>
      </section>
    </main>
  );
}
