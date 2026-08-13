import type { UIMessage } from "ai";

export function getUIMessageText(parts: UIMessage["parts"]): string {
  return parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");
}
