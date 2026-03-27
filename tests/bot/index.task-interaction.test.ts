import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "grammy";
import { interactionManager } from "../../src/interaction/manager.js";
import { t } from "../../src/i18n/index.js";

const mocked = vi.hoisted(() => ({
  getScopeFromContextMock: vi.fn(),
}));

vi.mock("../../src/bot/scope.js", () => ({
  GLOBAL_SCOPE_KEY: "global",
  getScopeFromContext: mocked.getScopeFromContextMock,
}));

function blockMenuWhileInteractionActiveForTest(ctx: Context): Promise<boolean> {
  const activeInteraction = interactionManager.getSnapshot(
    mocked.getScopeFromContextMock(ctx)?.key ?? "global",
  );
  if (!activeInteraction) {
    return Promise.resolve(false);
  }

  return ctx
    .reply(
      activeInteraction.kind === "task"
        ? t("task.blocked.only_defaults_before_prompt")
        : t("interaction.blocked.finish_current"),
    )
    .then(() => true);
}

describe("bot task interaction menu blocking", () => {
  beforeEach(() => {
    interactionManager.clear("test_setup");
    mocked.getScopeFromContextMock.mockReset();
    mocked.getScopeFromContextMock.mockReturnValue({ key: "global" });
  });

  it("shows a task-specific message when trying to open menus during task setup", async () => {
    interactionManager.start({
      kind: "task",
      expectedInput: "text",
      metadata: { stage: "prompt" },
    });

    const replyMock = vi.fn().mockResolvedValue(undefined);
    const ctx = { reply: replyMock } as unknown as Context;

    const blocked = await blockMenuWhileInteractionActiveForTest(ctx);

    expect(blocked).toBe(true);
    expect(replyMock).toHaveBeenCalledWith(t("task.blocked.only_defaults_before_prompt"));
  });
});
