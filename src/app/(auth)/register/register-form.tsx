"use client";

import { useActionState } from "react";

import { registerAction, type AuthActionState } from "../actions";
import { SubmitButton } from "../submit-button";

const initialState: AuthActionState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-xl bg-emerald-50 px-4 py-5 text-sm leading-6 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        <p className="font-medium">请检查你的邮箱</p>
        <p className="mt-1">{state.message}</p>
        {state.email && <p className="mt-2 font-medium">{state.email}</p>}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
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
          autoComplete="new-password"
          minLength={8}
          required
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
          placeholder="至少 8 位"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          确认密码
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
          placeholder="再次输入密码"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}

      <SubmitButton>注册</SubmitButton>
    </form>
  );
}
