import type { ModelMessage } from "ai";

/**
 * Filter conversation history to only include compatible message formats.
 *
 * Tool result messages must only be sent when their matching assistant tool-call
 * message is also present. Otherwise OpenAI/Azure rejects the request with:
 * "No tool call found for function call output with call_id ..."
 */
export const filterCompatibleMessages = (
  messages: ModelMessage[],
): ModelMessage[] => {
  const seenToolCallIds = new Set<string>();
  const filtered: ModelMessage[] = [];

  for (const msg of messages) {
    // runAgent always prepends the current system prompt, so don't replay old ones.
    if (msg.role === "system") {
      continue;
    }

    if (msg.role === "user") {
      filtered.push(msg);
      continue;
    }

    if (msg.role === "assistant") {
      const content = msg.content;

      if (typeof content === "string") {
        if (content.trim()) {
          filtered.push(msg);
        }
        continue;
      }

      if (Array.isArray(content)) {
        let hasCompatibleContent = false;

        for (const part of content) {
          if (typeof part !== "object" || part === null) {
            continue;
          }

          const typedPart = part as {
            type?: string;
            text?: string;
            toolCallId?: string;
          };

          if (typedPart.text?.trim()) {
            hasCompatibleContent = true;
          }

          if (
            typedPart.toolCallId &&
            (typedPart.type === "tool-call" ||
              typedPart.type === "function-call")
          ) {
            seenToolCallIds.add(typedPart.toolCallId);
            hasCompatibleContent = true;
          }
        }

        if (hasCompatibleContent) {
          filtered.push(msg);
        }
      }

      continue;
    }

    if (msg.role === "tool") {
      const content = msg.content;

      const hasMatchingToolCall =
        Array.isArray(content) &&
        content.some((part) => {
          if (typeof part !== "object" || part === null) {
            return false;
          }

          const typedPart = part as { toolCallId?: string };
          return (
            typeof typedPart.toolCallId === "string" &&
            seenToolCallIds.has(typedPart.toolCallId)
          );
        });

      if (hasMatchingToolCall) {
        filtered.push(msg);
      }
    }
  }

  return filtered;
};
