"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSafeRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getValue(formData, "email").trim().toLowerCase();
  const password = getValue(formData, "password");
  const next = getValue(formData, "next").trim();

  if (!EMAIL_PATTERN.test(email) || !password) {
    return {
      status: "error",
      message: "请输入有效的邮箱和密码。",
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: "邮箱或密码错误。",
      email,
    };
  }

  revalidatePath("/", "layout");
  redirect(getSafeRedirect(next));
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getValue(formData, "email").trim().toLowerCase();
  const password = getValue(formData, "password");
  const confirmPassword = getValue(formData, "confirmPassword");

  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "请输入有效的邮箱地址。",
      email,
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "密码至少需要 8 位。",
      email,
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "两次输入的密码不一致。",
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return {
      status: "error",
      message: "注册暂时失败，请稍后重试。",
      email,
    };
  }

  return {
    status: "success",
    message: "注册申请已提交，请检查邮箱并完成验证。",
    email,
  };
}
