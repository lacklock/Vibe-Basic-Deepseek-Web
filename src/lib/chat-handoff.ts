const PENDING_CHAT_PREFIX = "vibe-chat:pending:";

export type PendingChatMessage = {
  messageId: string;
  content: string;
};

export function getPendingChatKey(chatId: string) {
  return `${PENDING_CHAT_PREFIX}${chatId}`;
}

export function encodePendingChatMessage(message: PendingChatMessage): string {
  return JSON.stringify(message);
}

export function decodePendingChatMessage(value: string): PendingChatMessage | null {
  try {
    const parsedValue: unknown = JSON.parse(value);

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("messageId" in parsedValue) ||
      typeof parsedValue.messageId !== "string" ||
      !("content" in parsedValue) ||
      typeof parsedValue.content !== "string" ||
      parsedValue.content.trim().length === 0
    ) {
      return null;
    }

    return {
      messageId: parsedValue.messageId,
      content: parsedValue.content,
    };
  } catch {
    return null;
  }
}
