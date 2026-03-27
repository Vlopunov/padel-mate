import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function findCommand(ctx, miniAppUrl) {
  const userId = ctx.user?.user_id;

  try {
    const { getAvailableMatches, getLevelByValue } = require("../../server/services/botData");
    const matches = await getAvailableMatches(userId);

    if (matches.length === 0) {
      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.link("🎾 Создать матч", miniAppUrl)],
      ]);
      await ctx.reply(
        "🔍 Нет доступных матчей.\n\nСоздайте свой через /create или откройте приложение!",
        { attachments: [keyboard] }
      );
      return;
    }

    let text = `🔍 <b>Доступные матчи (${matches.length})</b>\n\n`;
    const buttons = [];

    for (const m of matches) {
      const date = new Date(m.date);
      const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const spots = 4 - m.playerCount;

      const minCat = getLevelByValue(m.levelMin)?.category || "D";
      const maxCat = getLevelByValue(m.levelMax)?.category || "A";
      const levelStr = minCat === maxCat ? minCat : `${minCat}–${maxCat}`;

      text += `🎾 <b>Матч #${m.matchId}</b>\n`;
      text += `📍 ${m.venue}\n`;
      text += `📅 ${dateStr}, ${timeStr} (${m.durationMin} мин)\n`;
      text += `👥 ${m.playerCount}/4 — ${m.playerNames.join(", ") || "—"}\n`;
      text += `📊 Уровень: ${levelStr}\n`;
      text += `🟢 Свободно мест: ${spots}\n\n`;

      buttons.push([Keyboard.button.callback(`➕ Вступить в матч #${m.matchId}`, `bot_join_${m.matchId}`)]);
    }

    const keyboard = Keyboard.inlineKeyboard(buttons);
    await ctx.reply(text, { format: "html", attachments: [keyboard] });
  } catch (err) {
    console.error("Find command error:", err);
    await ctx.reply("❌ Ошибка загрузки матчей. Попробуйте позже.");
  }
}
