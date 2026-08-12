"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  nickname?: string;
};

const nicknameSchema = z.string().trim().min(1, "请输入昵称。").max(32, "昵称最多 32 个字符。");

export async function updateNicknameAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const rawNickname = formData.get("nickname");
  const nickname = typeof rawNickname === "string" ? rawNickname.trim() : "";
  const result = nicknameSchema.safeParse(nickname);

  if (!result.success) {
    return {
      status: "error",
      message: result.error.issues[0]?.message ?? "昵称格式不正确。",
      nickname,
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return {
      status: "error",
      message: "登录状态已失效，请重新登录。",
      nickname: result.data,
    };
  }

  try {
    const updatedProfiles = await db
      .update(usersTable)
      .set({
        nickname: result.data,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id });

    if (updatedProfiles.length === 0) {
      logger.error({ userId }, "用户 profile 不存在");
      return {
        status: "error",
        message: "用户资料不存在，请稍后重试。",
        nickname: result.data,
      };
    }
  } catch (error) {
    logger.error({ err: error, userId }, "更新用户昵称失败");
    return {
      status: "error",
      message: "昵称保存失败，请稍后重试。",
      nickname: result.data,
    };
  }

  revalidatePath("/");
  revalidatePath("/profile");

  return {
    status: "success",
    message: "昵称已保存。",
    nickname: result.data,
  };
}
