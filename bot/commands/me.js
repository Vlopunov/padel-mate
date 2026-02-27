module.exports = async function meCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { getUserProfile } = require("../../server/services/botData");
    const { CITY_MAP } = require("../../server/config/app");

    const profile = await getUserProfile(telegramId);
    if (!profile) {
      await bot.sendMessage(chatId, "⚠️ Вы ещё не зарегистрированы. Откройте приложение через /start");
      return;
    }

    const winRate = profile.matchesPlayed > 0
      ? Math.round((profile.wins / profile.matchesPlayed) * 100)
      : 0;

    const cityName = CITY_MAP[profile.city] || profile.city || "—";

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

    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Открыть профиль", web_app: { url: process.env.MINI_APP_URL || "https://your-domain.com" } }],
        ],
      },
    });
  } catch (err) {
    console.error("Me command error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка загрузки профиля. Попробуйте позже.");
  }
};
