import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function studentsCommand(ctx, miniAppUrl) {
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

    if (!user.isCoach) {
      await ctx.reply("⚠️ Эта команда доступна только тренерам.");
      return;
    }

    const coachData = require("../../server/services/coachData");
    const students = await coachData.getCoachStudents(user.id);

    if (students.length === 0) {
      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.link("📱 Открыть панель тренера", miniAppUrl)],
      ]);
      await ctx.reply(
        "👨‍🏫 <b>Мои ученики</b>\n\nУ вас пока нет учеников.\nДобавьте их через панель тренера в приложении.",
        { format: "html", attachments: [keyboard] }
      );
      return;
    }

    let text = `👨‍🏫 <b>Мои ученики (${students.length})</b>\n\n`;

    for (const s of students) {
      const growthSign = s.ratingGrowth >= 0 ? "+" : "";
      const growthEmoji = s.ratingGrowth > 0 ? "📈" : s.ratingGrowth < 0 ? "📉" : "➡️";
      text += `${growthEmoji} <b>${s.firstName} ${s.lastName || ""}</b>\n`;
      text += `   📊 ${s.rating} ELO (${growthSign}${s.ratingGrowth}) · ${s.winRate}% побед · ${s.matchesPlayed} матчей\n\n`;
    }

    const keyboard = Keyboard.inlineKeyboard([
      [Keyboard.button.link("📱 Панель тренера", miniAppUrl)],
    ]);

    await ctx.reply(text, { format: "html", attachments: [keyboard] });
  } catch (err) {
    console.error("Students command error:", err);
    await ctx.reply("❌ Ошибка загрузки. Попробуйте позже.");
  }
}
