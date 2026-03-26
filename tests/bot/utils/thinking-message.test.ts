import { describe, expect, it } from "vitest";
import {
  buildThinkingMessage,
  hasOnlyThinkingLine,
} from "../../../src/bot/utils/thinking-message.js";

describe("bot/utils/thinking-message", () => {
  it("builds a thinking message with updates", () => {
    expect(buildThinkingMessage("💭 Thinking...", ["⏳ bash npm test", "✅ read src/app.ts"])).toBe(
      "💭 Thinking...\n\n⏳ bash npm test\n\n✅ read src/app.ts",
    );
  });

  it("deduplicates a repeated thinking line from updates", () => {
    expect(buildThinkingMessage("💭 Thinking...", ["💭 Thinking...", "⏳ bash npm test"])).toBe(
      "💭 Thinking...\n\n⏳ bash npm test",
    );
  });

  it("detects thinking-only state", () => {
    expect(hasOnlyThinkingLine("💭 Thinking...", [])).toBe(true);
    expect(hasOnlyThinkingLine("💭 Thinking...", ["⏳ bash npm test"])).toBe(false);
  });
});
