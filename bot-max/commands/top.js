import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function topCommand(ctx, miniAppUrl) {
  const userId = ctx.user?.user_id;

  try {
    const { getLeaderboard } = require("../../server/services/botData");
    const { users, callerPosition } = await getLeaderboard(10, userId);

    if (users.length === 0) {
      await ctx.reply("📊 Пока нет игроков с сыгранными матчами.");
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    let text = `🏆 <b>Топ-${users.length} игроков Padel GO</b>\n\n`;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const prefix = i < 3 ? medals[i] : `<b>${i + 1}.</b>`;
      const wl = `${u.wins}W/${u.losses}L`;
      const isCaller = u.telegramId && u.telegramId.toString() === userId?.toString();
      const marker = isCaller ? " ← ты" : "";
      text += `${prefix} ${u.firstName} — <b>${u.rating}</b> (${wl})${marker}\n`;
    }

    if (callerPosition) {
      const isInTop = users.some(
        (u) => u.telegramId && u.telegramId.toString() === userId?.toString()
      );
      if (!isInTop) {
        text += `\n─────────────\n`;
        text += `📍 Ты: <b>#${callerPosition.position}</b> — ${callerPosition.firstName} — <b>${callerPosition.rating}</b> (${callerPosition.wins}W/${callerPosition.losses}L)\n`;
      }
    }

    const keyboard = Keyboard.inlineKeyboard([
      [Keyboard.button.link("🏆 Полный рейтинг", miniAppUrl)],
    ]);

    await ctx.reply(text, { format: "html", attachments: [keyboard] });
  } catch (err) {
    console.error("Top command error:", err);
    await ctx.reply("❌ Ошибка загрузки рейтинга. Попробуйте позже.");
  }
}
