"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSafeRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  email?: string;
};

const loginSchema = z.object({
  email: z.email("请输入有效的邮箱和密码。"),
  password: z.string().min(1, "请输入有效的邮箱和密码。"),
});

const registerSchema = z
  .object({
    email: z.email("请输入有效的邮箱地址。"),
    password: z.string().min(8, "密码至少需要 8 位。"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致。",
    path: ["confirmPassword"],
  });

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

  const result = loginSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      status: "error",
      message: result.error.issues[0]?.message ?? "请输入有效的邮箱和密码。",
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

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

  const result = registerSchema.safeParse({ email, password, confirmPassword });

  if (!result.success) {
    return {
      status: "error",
      message: result.error.issues[0]?.message ?? "注册信息不正确。",
      email,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  });

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
