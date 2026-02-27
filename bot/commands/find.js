module.exports = async function findCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { getAvailableMatches, getLevelByValue } = require("../../server/services/botData");

    const matches = await getAvailableMatches(telegramId);

    if (matches.length === 0) {
      await bot.sendMessage(
        chatId,
        "🔍 Нет доступных матчей.\n\nСоздайте свой через /create или откройте приложение!",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🎾 Создать матч", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
            ],
          },
        }
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

      buttons.push([{ text: `➕ Вступить в матч #${m.matchId}`, callback_data: `bot_join_${m.matchId}` }]);
    }

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (err) {
    console.error("Find command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка загрузки матчей. Попробуйте позже.");
  }
};
