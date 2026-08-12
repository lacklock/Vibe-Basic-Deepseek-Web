const PENDING_CHAT_PREFIX = "vibe-chat:pending:";

export function getPendingChatKey(chatId: string) {
  return `${PENDING_CHAT_PREFIX}${chatId}`;
}
