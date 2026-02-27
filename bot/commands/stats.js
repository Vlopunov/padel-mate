// Uses analytics service from server (shares same process)
// Do NOT import @prisma/client here — bot has separate node_modules

module.exports = async function statsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const {
      isAdmin,
      getTodaySummary,
      formatDigestMessage,
    } = require("../../server/services/analytics");

    // Check if user is admin
    const admin = await isAdmin(telegramId);
    if (!admin) {
      await bot.sendMessage(chatId, "⛔ Эта команда доступна только администраторам.");
      return;
    }

    await bot.sendMessage(chatId, "📊 Собираю статистику...");

    const { today, yesterday } = await getTodaySummary();
    const message = formatDigestMessage(today, yesterday);

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (err) {
    console.error("Stats command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка получения статистики. Попробуйте позже.");
  }
};
