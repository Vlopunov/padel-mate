module.exports = async function topCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { getLeaderboard } = require("../../server/services/botData");

    const { users, callerPosition } = await getLeaderboard(10, telegramId);

    if (users.length === 0) {
      await bot.sendMessage(chatId, "📊 Пока нет игроков с сыгранными матчами.");
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];

    let text = `🏆 <b>Топ-${users.length} игроков Padel GO</b>\n\n`;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const prefix = i < 3 ? medals[i] : `<b>${i + 1}.</b>`;
      const wl = `${u.wins}W/${u.losses}L`;
      const isCaller = u.telegramId && u.telegramId.toString() === telegramId.toString();
      const marker = isCaller ? " ← ты" : "";
      text += `${prefix} ${u.firstName} — <b>${u.rating}</b> (${wl})${marker}\n`;
    }

    // Show caller's position if not in top 10
    if (callerPosition) {
      const isInTop = users.some(
        (u) => u.telegramId && u.telegramId.toString() === telegramId.toString()
      );
      if (!isInTop) {
        text += `\n─────────────\n`;
        text += `📍 Ты: <b>#${callerPosition.position}</b> — ${callerPosition.firstName} — <b>${callerPosition.rating}</b> (${callerPosition.wins}W/${callerPosition.losses}L)\n`;
      }
    }

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🏆 Полный рейтинг", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
        ],
      },
    });
  } catch (err) {
    console.error("Top command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка загрузки рейтинга. Попробуйте позже.");
  }
};
