module.exports = async function cancelCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { getUserMatches } = require("../../server/services/botData");

    const matches = await getUserMatches(telegramId);

    if (matches.length === 0) {
      await bot.sendMessage(chatId, "📅 У вас нет предстоящих матчей для отмены.");
      return;
    }

    let text = `❌ <b>Выйти из матча</b>\n\nВыберите матч, из которого хотите выйти:\n\n`;

    const buttons = [];

    for (const m of matches) {
      const date = new Date(m.date);
      const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      text += `🎾 <b>#${m.matchId}</b> — ${m.venue}, ${dateStr} ${timeStr}\n`;

      buttons.push([
        { text: `❌ Выйти из матча #${m.matchId}`, callback_data: `bot_leave_${m.matchId}` },
      ]);
    }

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (err) {
    console.error("Cancel command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка. Попробуйте позже.");
  }
};
