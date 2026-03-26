import { formatSummary, getAssistantParseMode } from "../../summary/formatter.js";
import type { TelegramTextFormat } from "./telegram-text.js";
import type { ResponseStreamer } from "../streaming/response-streamer.js";

interface FinalizeAssistantResponseParams {
  sessionId: string;
  messageText: string;
  responseStreamer: ResponseStreamer;
  sendFallback: (parts: string[], format: TelegramTextFormat) => Promise<void>;
}

export async function finalizeAssistantResponse({
  sessionId,
  messageText,
  responseStreamer,
  sendFallback,
}: FinalizeAssistantResponseParams): Promise<{ streamed: boolean; partCount: number }> {
  const assistantParseMode = getAssistantParseMode();
  const format: TelegramTextFormat = assistantParseMode === "MarkdownV2" ? "markdown_v2" : "raw";

  const handledByStreamer = await responseStreamer.finalize(sessionId, messageText, format);
  if (handledByStreamer) {
    return { streamed: true, partCount: 1 };
  }

  const parts = formatSummary(messageText);
  if (parts.length === 0) {
    return { streamed: false, partCount: 0 };
  }

  await sendFallback(parts, format);
  return { streamed: false, partCount: parts.length };
}
