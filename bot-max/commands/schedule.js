import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function scheduleCommand(ctx, miniAppUrl) {
  const userId = ctx.user?.user_id;

  try {
    const prisma = require("../../server/lib/prisma");

    const user = await prisma.user.findFirst({
      where: { telegramId: BigInt(userId) },
    });

    if (!user) {
      await ctx.reply("⚠️ Вы ещё не зарегистрированы. Откройте приложение через /start");
      return;
    }

    const coachData = require("../../server/services/coachData");

    if (user.isCoach) {
      // Coach schedule
      const sessions = await coachData.getCoachSchedule(user.id, { from: new Date().toISOString() });
      const upcoming = sessions.filter(
        (s) => s.status !== "CANCELLED" && s.status !== "COMPLETED" && new Date(s.date) > new Date()
      );

      if (upcoming.length === 0) {
        const keyboard = Keyboard.inlineKeyboard([
          [Keyboard.button.link("📱 Создать тренировку", miniAppUrl)],
        ]);
        await ctx.reply("📅 <b>Расписание тренировок</b>\n\nНет предстоящих тренировок.", {
          format: "html",
          attachments: [keyboard],
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

      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.link("📱 Панель тренера", miniAppUrl)],
      ]);

      await ctx.reply(text, { format: "html", attachments: [keyboard] });
    } else {
      // Student sessions
      const sessions = await coachData.getStudentSessions(user.id);

      if (sessions.length === 0) {
        const keyboard = Keyboard.inlineKeyboard([
          [Keyboard.button.link("📱 Открыть приложение", miniAppUrl)],
        ]);
        await ctx.reply("📅 <b>Мои тренировки</b>\n\nНет предстоящих тренировок.", {
          format: "html",
          attachments: [keyboard],
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

      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.link("📱 Открыть приложение", miniAppUrl)],
      ]);

      await ctx.reply(text, { format: "html", attachments: [keyboard] });
    }
  } catch (err) {
    console.error("Schedule command error:", err);
    await ctx.reply("❌ Ошибка загрузки. Попробуйте позже.");
  }
}
