import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  toUIMessageStream,
} from "ai";
import { deepseek } from "@ai-sdk/deepseek";

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return Response.json({ error: "未登录或登录状态已失效。" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求内容不是有效的 JSON。" }, { status: 400 });
  }

  const messages =
    typeof body === "object" && body !== null && "messages" in body
      ? (body as { messages: unknown }).messages
      : undefined;
  const validation = await safeValidateUIMessages<UIMessage>({ messages });

  if (!validation.success) {
    return Response.json({ error: "消息格式无效。" }, { status: 400 });
  }

  const result = streamText({
    model: deepseek("deepseek-v4-flash"),
    messages: await convertToModelMessages(validation.data),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
