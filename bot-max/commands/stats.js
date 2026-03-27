import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function statsCommand(ctx) {
  const userId = ctx.user?.user_id;

  try {
    const { isAdmin, getTodaySummary, formatDigestMessage } = require("../../server/services/analytics");

    const admin = await isAdmin(userId);
    if (!admin) {
      await ctx.reply("⛔ Эта команда доступна только администраторам.");
      return;
    }

    await ctx.reply("📊 Собираю статистику...");

    const { today, yesterday } = await getTodaySummary();
    const message = formatDigestMessage(today, yesterday);

    await ctx.reply(message, { format: "html" });
  } catch (err) {
    console.error("Stats command error:", err);
    await ctx.reply("❌ Ошибка получения статистики. Попробуйте позже.");
  }
}
