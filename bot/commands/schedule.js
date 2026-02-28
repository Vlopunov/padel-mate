module.exports = async function scheduleCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findFirst({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      await bot.sendMessage(chatId, "⚠️ Вы ещё не зарегистрированы. Откройте приложение через /start");
      return;
    }

    // Check if user is a coach
    if (user.isCoach) {
      // Show coach schedule
      const coachData = require("../../server/services/coachData");
      const sessions = await coachData.getCoachSchedule(user.id, {
        from: new Date().toISOString(),
      });

      const upcoming = sessions.filter(
        (s) => s.status !== "CANCELLED" && s.status !== "COMPLETED" && new Date(s.date) > new Date()
      );

      if (upcoming.length === 0) {
        await bot.sendMessage(chatId, "📅 <b>Расписание тренировок</b>\n\nНет предстоящих тренировок.", {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📱 Создать тренировку", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
            ],
          },
        });
        return;
      }

      let text = `📅 <b>Расписание тренировок (${upcoming.length})</b>\n\n`;

      for (const s of upcoming.slice(0, 10)) {
        const d = new Date(s.date);
        const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        const timeStr = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const typeEmoji = s.type === "GROUP" ? "👥" : "👤";
        const statusEmoji = s.status === "FULL" ? "🟣" : "🟢";

        text += `${statusEmoji} ${typeEmoji} <b>${dateStr}, ${timeStr}</b>\n`;
        text += `   ${s.venue?.name || "Без площадки"} · ${s.durationMin} мин · ${s.bookedCount}/${s.maxStudents}\n\n`;
      }

      if (upcoming.length > 10) {
        text += `\n<i>...и ещё ${upcoming.length - 10}</i>`;
      }

      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📱 Панель тренера", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
          ],
        },
      });
    } else {
      // Show student's booked sessions
      const coachData = require("../../server/services/coachData");
      const sessions = await coachData.getStudentSessions(user.id);

      if (sessions.length === 0) {
        await bot.sendMessage(chatId, "📅 <b>Мои тренировки</b>\n\nНет предстоящих тренировок.", {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📱 Открыть приложение", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
            ],
          },
        });
        return;
      }

      let text = `📅 <b>Мои тренировки (${sessions.length})</b>\n\n`;

      for (const s of sessions.slice(0, 10)) {
        const d = new Date(s.date);
        const dateStr = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        const timeStr = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const typeEmoji = s.type === "GROUP" ? "👥" : "👤";

        text += `${typeEmoji} <b>${dateStr}, ${timeStr}</b>\n`;
        text += `   👨‍🏫 ${s.coach?.firstName || "Тренер"} · ${s.venue?.name || "—"} · ${s.durationMin} мин\n\n`;
      }

      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📱 Открыть приложение", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
          ],
        },
      });
    }
  } catch (err) {
    console.error("Schedule command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка загрузки. Попробуйте позже.");
  }
};
