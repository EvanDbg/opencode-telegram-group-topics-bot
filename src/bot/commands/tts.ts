import { CommandContext, Context } from "grammy";
import { isTtsConfigured } from "../../tts/client.js";
import { isTtsEnabled, setTtsEnabled } from "../../settings/manager.js";
import { t } from "../../i18n/index.js";
import { getThreadSendOptions } from "../scope.js";

export async function ttsCommand(ctx: CommandContext<Context>): Promise<void> {
  const enabled = !isTtsEnabled();

  if (enabled && !isTtsConfigured()) {
    const message = t("tts.not_configured");

    if (!ctx.chat) {
      await ctx.reply(message);
      return;
    }

    await ctx.api.sendMessage(
      ctx.chat.id,
      message,
      getThreadSendOptions(ctx.message?.message_thread_id ?? null),
    );
    return;
  }

  setTtsEnabled(enabled);

  const message = enabled ? t("tts.enabled") : t("tts.disabled");

  if (!ctx.chat) {
    await ctx.reply(message);
    return;
  }

  await ctx.api.sendMessage(
    ctx.chat.id,
    message,
    getThreadSendOptions(ctx.message?.message_thread_id ?? null),
  );
}
