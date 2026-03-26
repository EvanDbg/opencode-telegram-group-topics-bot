import { beforeEach, describe, expect, it, vi } from "vitest";
import { pinnedMessageManager } from "../../src/pinned/manager.js";
import {
  __resetSettingsForTests,
  setCurrentProject,
  setCurrentModel,
} from "../../src/settings/manager.js";

const opencodeMocks = vi.hoisted(() => ({
  providers: vi.fn(),
  diff: vi.fn(),
  get: vi.fn(),
  messages: vi.fn(),
}));

vi.mock("../../src/opencode/client.js", () => ({
  opencodeClient: {
    config: {
      providers: opencodeMocks.providers,
    },
    session: {
      diff: opencodeMocks.diff,
      get: opencodeMocks.get,
      messages: opencodeMocks.messages,
    },
  },
}));

function createApi() {
  let nextId = 100;
  return {
    sendMessage: vi.fn().mockImplementation(async () => ({ message_id: nextId++ })),
    pinChatMessage: vi.fn().mockResolvedValue(true),
    editMessageText: vi.fn().mockResolvedValue(true),
    unpinChatMessage: vi.fn().mockResolvedValue(true),
    deleteMessage: vi.fn().mockResolvedValue(true),
  };
}

describe("pinned manager scoped state", () => {
  beforeEach(() => {
    __resetSettingsForTests();
    (pinnedMessageManager as unknown as { contexts: Map<string, unknown> }).contexts = new Map();
    opencodeMocks.providers.mockReset();
    opencodeMocks.diff.mockReset();
    opencodeMocks.get.mockReset();
    opencodeMocks.messages.mockReset();
    opencodeMocks.providers.mockResolvedValue({
      data: {
        providers: [
          {
            id: "openai",
            models: {
              "gpt-5": { limit: { context: 400000 } },
            },
          },
        ],
      },
      error: null,
    });
    opencodeMocks.diff.mockResolvedValue({ data: [], error: null });
    opencodeMocks.get.mockResolvedValue({ data: null, error: null });
    opencodeMocks.messages.mockResolvedValue({ data: [], error: null });
  });

  it("creates separate pinned messages for different thread scopes", async () => {
    const api = createApi();

    setCurrentProject({ id: "p1", worktree: "/repo/a" }, "chat:-1:10");
    setCurrentModel({ providerID: "openai", modelID: "gpt-5", variant: "default" }, "chat:-1:10");
    setCurrentProject({ id: "p2", worktree: "/repo/b" }, "chat:-1:20");
    setCurrentModel({ providerID: "openai", modelID: "gpt-5", variant: "default" }, "chat:-1:20");

    pinnedMessageManager.initialize(api as never, -1, "chat:-1:10", 10);
    pinnedMessageManager.initialize(api as never, -1, "chat:-1:20", 20);

    await pinnedMessageManager.onSessionChange("s1", "thread 10", "chat:-1:10");
    await pinnedMessageManager.onSessionChange("s2", "thread 20", "chat:-1:20");

    expect(api.sendMessage).toHaveBeenCalledTimes(2);
    expect(api.sendMessage).toHaveBeenNthCalledWith(
      1,
      -1,
      expect.any(String),
      expect.objectContaining({ message_thread_id: 10 }),
    );
    expect(api.sendMessage).toHaveBeenNthCalledWith(
      2,
      -1,
      expect.any(String),
      expect.objectContaining({ message_thread_id: 20 }),
    );

    const stateA = pinnedMessageManager.getState("chat:-1:10");
    const stateB = pinnedMessageManager.getState("chat:-1:20");
    expect(stateA.messageId).not.toBeNull();
    expect(stateB.messageId).not.toBeNull();
    expect(stateA.messageId).not.toBe(stateB.messageId);
  });

  it("uses thread id from scope key when explicit thread id is missing", async () => {
    const api = createApi();

    setCurrentProject({ id: "p1", worktree: "/repo/a" }, "-1:77");
    setCurrentModel({ providerID: "openai", modelID: "gpt-5", variant: "default" }, "-1:77");

    pinnedMessageManager.initialize(api as never, -1, "-1:77", null);
    await pinnedMessageManager.onSessionChange("s1", "thread 77", "-1:77");

    expect(api.sendMessage).toHaveBeenCalledWith(
      -1,
      expect.any(String),
      expect.objectContaining({ message_thread_id: 77 }),
    );
  });

  it("loads assistant cost from history into the scoped pinned message", async () => {
    const api = createApi();

    setCurrentProject({ id: "p1", worktree: "/repo/a" }, "chat:-1:10");
    setCurrentModel({ providerID: "openai", modelID: "gpt-5", variant: "default" }, "chat:-1:10");
    opencodeMocks.messages.mockResolvedValue({
      data: [
        {
          info: {
            role: "assistant",
            cost: 0.01234,
            tokens: { input: 1200, cache: { read: 300 } },
          },
        },
        {
          info: {
            role: "assistant",
            cost: 0.00056,
            tokens: { input: 900, cache: { read: 25 } },
          },
        },
      ],
      error: null,
    });

    pinnedMessageManager.initialize(api as never, -1, "chat:-1:10", 10);
    await pinnedMessageManager.onSessionChange("s1", "thread 10", "chat:-1:10");

    expect(api.sendMessage).toHaveBeenCalledWith(
      -1,
      expect.stringContaining("Cost: $0.00"),
      expect.objectContaining({ message_thread_id: 10 }),
    );
    expect(api.editMessageText).toHaveBeenCalledWith(
      -1,
      100,
      expect.stringContaining("Cost: $0.013"),
    );

    expect(pinnedMessageManager.getState("chat:-1:10")).toEqual(
      expect.objectContaining({
        assistantCost: 0.0129,
        tokensUsed: 1500,
      }),
    );
  });
});
