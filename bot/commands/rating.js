const fetch = require("node-fetch");

module.exports = async function ratingCommand(bot, msg, apiUrl) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    // We'll do a simple lookup — in production this would use proper auth
    await bot.sendMessage(
      chatId,
      `📊 Чтобы посмотреть ваш рейтинг и статистику, откройте приложение:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📊 Мой рейтинг", web_app: { url: `${process.env.MINI_APP_URL || "https://your-domain.com"}` } }],
          ],
        },
      }
    );
  } catch (err) {
    console.error("Rating command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка получения рейтинга. Попробуйте позже.");
  }
};
