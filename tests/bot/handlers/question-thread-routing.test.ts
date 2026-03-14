import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "grammy";
import { questionManager } from "../../../src/question/manager.js";
import { interactionManager } from "../../../src/interaction/manager.js";
import { handleQuestionCallback, showCurrentQuestion } from "../../../src/bot/handlers/question.js";

const QUESTION_ONE = {
  header: "Q1",
  question: "Pick one",
  options: [
    { label: "Yes", description: "accept" },
    { label: "No", description: "decline" },
  ],
};

function createApi(sendMessageIds: number[]): Context["api"] {
  let index = 0;

  return {
    sendMessage: vi.fn().mockImplementation(async () => {
      const messageId = sendMessageIds[index] ?? sendMessageIds[sendMessageIds.length - 1] ?? 1;
      index += 1;
      return { message_id: messageId };
    }),
    deleteMessage: vi.fn().mockResolvedValue(true),
  } as unknown as Context["api"];
}

function createTopicCallbackContext(data: string, messageId: number, api: Context["api"]): Context {
  return {
    chat: { id: -1001, type: "supergroup" } as Context["chat"],
    callbackQuery: {
      data,
      message: {
        message_id: messageId,
        message_thread_id: 77,
      },
    } as Context["callbackQuery"],
    api,
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    deleteMessage: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;
}

describe("bot/handlers/question thread routing", () => {
  beforeEach(() => {
    questionManager.clear();
    interactionManager.clear("test_setup");
  });

  it("keeps poll completion summary in the originating topic", async () => {
    const api = createApi([100, 101]);

    questionManager.startQuestions([QUESTION_ONE], "req-1", "-1001:77");
    await showCurrentQuestion(api, -1001, "-1001:77", 77);

    const ctx = createTopicCallbackContext("question:select:0:0", 100, api);
    const handled = await handleQuestionCallback(ctx);

    expect(handled).toBe(true);
    expect(api.sendMessage).toHaveBeenLastCalledWith(
      -1001,
      expect.stringContaining("✅ Poll completed!"),
      { message_thread_id: 77 },
    );
  });
});
