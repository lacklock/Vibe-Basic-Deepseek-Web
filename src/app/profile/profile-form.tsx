"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/app/(auth)/submit-button";

import { updateNicknameAction, type ProfileActionState } from "./actions";

export function ProfileForm({ nickname }: { nickname: string }) {
  const initialState: ProfileActionState = {
    status: "idle",
    nickname,
  };
  const [state, formAction] = useActionState(updateNicknameAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="nickname"
          className="mb-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          昵称
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          defaultValue={state.nickname}
          maxLength={32}
          required
          autoFocus
          aria-describedby="nickname-hint"
          className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-zinc-950 transition outline-none placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
          placeholder="输入你的昵称"
        />
        <p id="nickname-hint" className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          最多 32 个字符。
        </p>
      </div>

      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-emerald-700 dark:text-emerald-400"
          }
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton>保存昵称</SubmitButton>
    </form>
  );
}
