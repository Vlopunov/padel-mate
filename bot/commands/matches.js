module.exports = async function matchesCommand(bot, msg) {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `🎾 Посмотреть и присоединиться к матчам можно в приложении:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎾 Найти матч", web_app: { url: `${process.env.MINI_APP_URL || "https://your-domain.com"}` } }],
        ],
      },
    }
  );
};
