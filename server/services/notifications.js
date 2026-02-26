const BOT_TOKEN = process.env.BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) {
    console.log(`[Notification] Would send to ${chatId}: ${text}`);
    return;
  }

  try {
    const body = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...options,
    };

    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`Telegram API error: ${res.status}`);
    }
  } catch (err) {
    console.error("Failed to send notification:", err.message);
  }
}

async function notifyScoreConfirmation(user, match, sets) {
  const setsStr = sets.map((s) => {
    let str = `${s.team1Score}:${s.team2Score}`;
    if (s.team1Tiebreak != null && s.team2Tiebreak != null) {
      str += ` (${s.team1Tiebreak}:${s.team2Tiebreak})`;
    }
    return str;
  }).join(", ");
  const text =
    `✅ <b>${user.firstName}</b> записал счёт матча.\n` +
    `📊 Счёт: ${setsStr}\n\n` +
    `Подтвердите результат:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Подтвердить", callback_data: `confirm_score_${match.id}` },
        { text: "❌ Оспорить", callback_data: `dispute_score_${match.id}` },
      ],
    ],
  };

  return { text, reply_markup: keyboard };
}

async function notifyRatingChange(telegramId, oldRating, newRating, change) {
  const emoji = change > 0 ? "📈" : "📉";
  const sign = change > 0 ? "+" : "";
  const text = `${emoji} <b>Рейтинг обновлён:</b> ${oldRating} → ${newRating} (${sign}${change})`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyNewAchievement(telegramId, achievement) {
  const text = `🏅 <b>Новое достижение:</b> ${achievement.icon} ${achievement.name}\n+${achievement.xp} XP`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyMatchReminder(telegramId, match, minutesBefore) {
  const text =
    `⏰ <b>Напоминание:</b> через ${minutesBefore} мин у вас матч!\n` +
    `📍 ${match.venue.name}\n` +
    `🕐 ${new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyNewMatchInArea(telegramId, match) {
  const text =
    `🎾 Появился матч вашего уровня!\n` +
    `📍 ${match.venue.name}\n` +
    `📅 ${new Date(match.date).toLocaleDateString("ru-RU")}`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyTournamentOpen(telegramId, tournament) {
  const text = `🏆 <b>Открыта запись на турнир:</b> ${tournament.name}\n📅 ${new Date(tournament.date).toLocaleDateString("ru-RU")}`;
  await sendTelegramMessage(telegramId, text);
}

module.exports = {
  sendTelegramMessage,
  notifyScoreConfirmation,
  notifyRatingChange,
  notifyNewAchievement,
  notifyMatchReminder,
  notifyNewMatchInArea,
  notifyTournamentOpen,
};
