module.exports = async function studentsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const prisma = require("../../server/lib/prisma");

    // Find coach by telegramId
    const user = await prisma.user.findFirst({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      await bot.sendMessage(chatId, "⚠️ Вы ещё не зарегистрированы. Откройте приложение через /start");
      return;
    }

    if (!user.isCoach) {
      await bot.sendMessage(chatId, "⚠️ Эта команда доступна только тренерам.");
      return;
    }

    // Get students
    const coachData = require("../../server/services/coachData");
    const students = await coachData.getCoachStudents(user.id);

    if (students.length === 0) {
      await bot.sendMessage(chatId, "👨‍🏫 <b>Мои ученики</b>\n\nУ вас пока нет учеников.\nДобавьте их через панель тренера в приложении.", {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📱 Открыть панель тренера", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
          ],
        },
      });
      return;
    }

    let text = `👨‍🏫 <b>Мои ученики (${students.length})</b>\n\n`;

    for (const s of students) {
      const growthSign = s.ratingGrowth >= 0 ? "+" : "";
      const growthEmoji = s.ratingGrowth > 0 ? "📈" : s.ratingGrowth < 0 ? "📉" : "➡️";
      text += `${growthEmoji} <b>${s.firstName} ${s.lastName || ""}</b>\n`;
      text += `   📊 ${s.rating} ELO (${growthSign}${s.ratingGrowth}) · ${s.winRate}% побед · ${s.matchesPlayed} матчей\n\n`;
    }

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Панель тренера", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
        ],
      },
    });
  } catch (err) {
    console.error("Students command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка загрузки. Попробуйте позже.");
  }
};
