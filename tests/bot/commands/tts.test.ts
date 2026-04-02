import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "grammy";
import { ttsCommand } from "../../../src/bot/commands/tts.js";
import { t } from "../../../src/i18n/index.js";

const mocked = vi.hoisted(() => ({
  isTtsEnabledMock: vi.fn(),
  setTtsEnabledMock: vi.fn(),
  isTtsConfiguredMock: vi.fn(),
}));

vi.mock("../../../src/settings/manager.js", () => ({
  isTtsEnabled: mocked.isTtsEnabledMock,
  setTtsEnabled: mocked.setTtsEnabledMock,
}));

vi.mock("../../../src/tts/client.js", () => ({
  isTtsConfigured: mocked.isTtsConfiguredMock,
}));

describe("bot/commands/tts", () => {
  beforeEach(() => {
    mocked.isTtsEnabledMock.mockReset();
    mocked.setTtsEnabledMock.mockReset();
    mocked.isTtsConfiguredMock.mockReset();
  });

  it("enables audio replies globally", async () => {
    mocked.isTtsEnabledMock.mockReturnValue(false);
    mocked.isTtsConfiguredMock.mockReturnValue(true);
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);
    const ctx = {
      chat: { id: -100, type: "supergroup" },
      message: { text: "/tts", message_thread_id: 22 },
      reply: vi.fn().mockResolvedValue(undefined),
      api: { sendMessage: sendMessageMock },
    } as unknown as Context;

    await ttsCommand(ctx as never);

    expect(mocked.setTtsEnabledMock).toHaveBeenCalledWith(true);
    expect(sendMessageMock).toHaveBeenCalledWith(-100, t("tts.enabled"), { message_thread_id: 22 });
  });

  it("does not enable audio replies when TTS is not configured", async () => {
    mocked.isTtsEnabledMock.mockReturnValue(false);
    mocked.isTtsConfiguredMock.mockReturnValue(false);
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);
    const ctx = {
      chat: { id: -100, type: "supergroup" },
      message: { text: "/tts", message_thread_id: 22 },
      reply: vi.fn().mockResolvedValue(undefined),
      api: { sendMessage: sendMessageMock },
    } as unknown as Context;

    await ttsCommand(ctx as never);

    expect(mocked.setTtsEnabledMock).not.toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalledWith(-100, t("tts.not_configured"), {
      message_thread_id: 22,
    });
  });

  it("disables audio replies globally", async () => {
    mocked.isTtsEnabledMock.mockReturnValue(true);
    const sendMessageMock = vi.fn().mockResolvedValue(undefined);
    const ctx = {
      chat: { id: -100, type: "supergroup" },
      message: { text: "/tts", message_thread_id: 22 },
      reply: vi.fn().mockResolvedValue(undefined),
      api: { sendMessage: sendMessageMock },
    } as unknown as Context;

    await ttsCommand(ctx as never);

    expect(mocked.setTtsEnabledMock).toHaveBeenCalledWith(false);
    expect(sendMessageMock).toHaveBeenCalledWith(-100, t("tts.disabled"), {
      message_thread_id: 22,
    });
  });
});
