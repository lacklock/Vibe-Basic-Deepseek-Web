"use client";

import { useActionState } from "react";

import { loginAction, type AuthActionState } from "../actions";
import { SubmitButton } from "../submit-button";

const initialState: AuthActionState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
          placeholder="输入密码"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      <SubmitButton>登录</SubmitButton>
    </form>
  );
}
