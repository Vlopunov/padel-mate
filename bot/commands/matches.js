module.exports = async function matchesCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { getUserMatches } = require("../../server/services/botData");

    const matches = await getUserMatches(telegramId);

    if (matches.length === 0) {
      await bot.sendMessage(
        chatId,
        "📅 У вас нет предстоящих матчей.\n\nНайдите матч через /find или создайте через /create!",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔍 Найти матч", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
            ],
          },
        }
      );
      return;
    }

    let text = `📅 <b>Ваши предстоящие матчи (${matches.length})</b>\n\n`;

    for (const m of matches) {
      const date = new Date(m.date);
      const dateStr = date.toLocaleDateString("ru-RU", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
      const statusIcon = m.status === "FULL" ? "🟢" : "🟡";

      text += `${statusIcon} <b>Матч #${m.matchId}</b>\n`;
      text += `📍 ${m.venue}\n`;
      text += `📅 ${dateStr}, ${timeStr} (${m.durationMin} мин)\n`;
      text += `👥 ${m.playerCount}/4 — ${m.playerNames.join(", ")}\n\n`;
    }

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Все матчи в приложении", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
        ],
      },
    });
  } catch (err) {
    console.error("Matches command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка загрузки матчей. Попробуйте позже.");
  }
};
