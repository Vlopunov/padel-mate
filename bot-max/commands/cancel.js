import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function cancelCommand(ctx) {
  const userId = ctx.user?.user_id;

  try {
    const { getUserMatches } = require("../../server/services/botData");
    const matches = await getUserMatches(userId);

    if (matches.length === 0) {
      await ctx.reply("📅 У вас нет предстоящих матчей для отмены.");
      return;
    }

    let text = `❌ <b>Выйти из матча</b>\n\nВыберите матч, из которого хотите выйти:\n\n`;
    const buttons = [];

    for (const m of matches) {
      const date = new Date(m.date);
      const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      text += `🎾 <b>#${m.matchId}</b> — ${m.venue}, ${dateStr} ${timeStr}\n`;
      buttons.push([Keyboard.button.callback(`❌ Выйти из матча #${m.matchId}`, `bot_leave_${m.matchId}`)]);
    }

    const keyboard = Keyboard.inlineKeyboard(buttons);
    await ctx.reply(text, { format: "html", attachments: [keyboard] });
  } catch (err) {
    console.error("Cancel command error:", err);
    await ctx.reply("❌ Ошибка. Попробуйте позже.");
  }
}
