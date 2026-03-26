import { afterEach, describe, expect, it, vi } from "vitest";
import { ToolCallStreamer } from "../../../src/bot/streaming/tool-call-streamer.js";

describe("bot/streaming/tool-call-streamer", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams thinking and tool updates in one editable message", async () => {
    vi.useFakeTimers();

    const sendText = vi.fn().mockResolvedValue(501);
    const editText = vi.fn().mockResolvedValue(undefined);
    const deleteMessage = vi.fn().mockResolvedValue(undefined);
    const streamer = new ToolCallStreamer({ sendText, editText, deleteMessage, throttleMs: 100 });

    streamer.showThinking("s1", "💭 Thinking...");
    await vi.advanceTimersByTimeAsync(100);

    expect(sendText).toHaveBeenCalledWith("s1", "💭 Thinking...");

    streamer.pushUpdate("s1", "⏳ bash npm test");
    await vi.advanceTimersByTimeAsync(100);

    expect(editText).toHaveBeenCalledWith("s1", 501, "💭 Thinking...\n\n⏳ bash npm test");
  });

  it("clears only the thinking-only message when assistant text starts", async () => {
    vi.useFakeTimers();

    const sendText = vi.fn().mockResolvedValue(77);
    const editText = vi.fn().mockResolvedValue(undefined);
    const deleteMessage = vi.fn().mockResolvedValue(undefined);
    const streamer = new ToolCallStreamer({ sendText, editText, deleteMessage, throttleMs: 25 });

    streamer.showThinking("s1", "💭 Thinking...");
    await vi.advanceTimersByTimeAsync(25);

    await streamer.clearThinkingOnlySession("s1");

    expect(deleteMessage).toHaveBeenCalledWith("s1", 77);
  });

  it("keeps tool updates visible when dismissing the thinking line", async () => {
    vi.useFakeTimers();

    const sendText = vi.fn().mockResolvedValue(88);
    const editText = vi.fn().mockResolvedValue(undefined);
    const deleteMessage = vi.fn().mockResolvedValue(undefined);
    const streamer = new ToolCallStreamer({ sendText, editText, deleteMessage, throttleMs: 25 });

    streamer.showThinking("s1", "💭 Thinking...");
    streamer.pushUpdate("s1", "⏳ read src/app.ts");
    await vi.advanceTimersByTimeAsync(25);

    streamer.dismissThinking("s1");
    await vi.advanceTimersByTimeAsync(25);

    expect(editText).toHaveBeenLastCalledWith("s1", 88, "⏳ read src/app.ts");
    expect(deleteMessage).not.toHaveBeenCalled();
  });
});
