const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = async function statsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = BigInt(msg.from.id);

  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      await bot.sendMessage(chatId, "⛔ Эта команда доступна только администраторам.");
      return;
    }

    await bot.sendMessage(chatId, "📊 Собираю статистику...");

    const { getTodaySummary, formatDigestMessage } = require("../../server/services/analytics");
    const { today, yesterday } = await getTodaySummary();
    const message = formatDigestMessage(today, yesterday);

    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (err) {
    console.error("Stats command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка получения статистики. Попробуйте позже.");
  }
};
