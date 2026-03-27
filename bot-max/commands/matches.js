import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function matchesCommand(ctx, miniAppUrl) {
  const userId = ctx.user?.user_id;

  try {
    const { getUserMatches } = require("../../server/services/botData");
    const matches = await getUserMatches(userId);

    if (matches.length === 0) {
      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.link("🔍 Найти матч", miniAppUrl)],
      ]);
      await ctx.reply(
        "📅 У вас нет предстоящих матчей.\n\nНайдите матч через /find или создайте через /create!",
        { attachments: [keyboard] }
      );
      return;
    }

    let text = `📅 <b>Ваши предстоящие матчи (${matches.length})</b>\n\n`;

    for (const m of matches) {
      const date = new Date(m.date);
      const dateStr = date.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
      const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const statusIcon = m.status === "FULL" ? "🟢" : "🟡";

      text += `${statusIcon} <b>Матч #${m.matchId}</b>\n`;
      text += `📍 ${m.venue}\n`;
      text += `📅 ${dateStr}, ${timeStr} (${m.durationMin} мин)\n`;
      text += `👥 ${m.playerCount}/4 — ${m.playerNames.join(", ")}\n\n`;
    }

    const keyboard = Keyboard.inlineKeyboard([
      [Keyboard.button.link("📱 Все матчи в приложении", miniAppUrl)],
    ]);

    await ctx.reply(text, { format: "html", attachments: [keyboard] });
  } catch (err) {
    console.error("Matches command error:", err);
    await ctx.reply("❌ Ошибка загрузки матчей. Попробуйте позже.");
  }
}
