import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function meCommand(ctx, miniAppUrl) {
  const userId = ctx.user?.user_id;

  try {
    const { getUserProfile } = require("../../server/services/botData");
    const profile = await getUserProfile(userId);

    if (!profile) {
      await ctx.reply("⚠️ Вы ещё не зарегистрированы. Откройте приложение через /start");
      return;
    }

    const winRate = profile.matchesPlayed > 0
      ? Math.round((profile.wins / profile.matchesPlayed) * 100)
      : 0;

    const cityName = profile.regionName || "—";

    let text = `👤 <b>${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}</b>`;
    if (profile.isVip) text += ` ⭐`;
    text += `\n\n`;

    text += `📊 <b>Рейтинг:</b> ${profile.rating} (${profile.level.category} — ${profile.level.name})\n`;
    text += `🏆 <b>Позиция:</b> #${profile.position} из ${profile.totalPlayers}\n`;
    text += `🏙️ <b>Город:</b> ${cityName}\n\n`;

    text += `🎾 <b>Матчей:</b> ${profile.matchesPlayed}\n`;
    text += `✅ <b>Побед:</b> ${profile.wins} | ❌ <b>Поражений:</b> ${profile.losses}\n`;
    text += `📈 <b>Винрейт:</b> ${winRate}%\n`;

    if (profile.maxWinStreak > 0) {
      text += `🔥 <b>Лучшая серия:</b> ${profile.maxWinStreak} побед\n`;
    }

    text += `\n${profile.xpLevel.icon} <b>Уровень:</b> ${profile.xpLevel.name} (${profile.xp} XP)\n`;

    if (profile.achievements.length > 0) {
      text += `\n🏅 <b>Достижения:</b>\n`;
      for (const a of profile.achievements) {
        text += `  ${a.icon} ${a.name}\n`;
      }
    }

    if (profile.upcomingCount > 0) {
      text += `\n📅 Предстоящих матчей: <b>${profile.upcomingCount}</b>`;
    }

    const keyboard = Keyboard.inlineKeyboard([
      [Keyboard.button.link("📱 Открыть профиль", miniAppUrl)],
    ]);

    await ctx.reply(text, { format: "html", attachments: [keyboard] });
  } catch (err) {
    console.error("Me command error:", err);
    await ctx.reply("❌ Ошибка загрузки профиля. Попробуйте позже.");
  }
}
