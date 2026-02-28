const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://your-domain.com";
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
  const matchDate = new Date(match.date);
  const timeStr = matchDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = matchDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  let timeLabel;
  if (minutesBefore >= 60) {
    const hours = Math.floor(minutesBefore / 60);
    const mins = minutesBefore % 60;
    timeLabel = mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  } else {
    timeLabel = `${minutesBefore} мин`;
  }

  const text =
    `⏰ <b>Напоминание о матче!</b>\n\n` +
    `Через <b>${timeLabel}</b> у вас матч:\n` +
    `📍 ${match.venue?.name || "—"}\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `⏱ ${match.durationMin} мин`;
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть матч", web_app: { url: `${MINI_APP_URL}?match=${match.id}` } }],
      ],
    },
  });
}

async function notifyNewMatchInArea(telegramId, match) {
  const dateStr = new Date(match.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const timeStr = new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const spots = 4 - (match.approvedCount || 0);
  const text =
    `🎾 Появился матч вашего уровня!\n` +
    `📍 ${match.venue.name}\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `🟢 Свободных мест: ${spots}`;
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "➕ Вступить", callback_data: `bot_join_${match.id}` }],
        [{ text: "📱 Подробнее", web_app: { url: `${MINI_APP_URL}?match=${match.id}` } }],
      ],
    },
  });
}

async function notifyTournamentOpen(telegramId, tournament) {
  const text = `🏆 <b>Открыта запись на турнир:</b> ${tournament.name}\n📅 ${new Date(tournament.date).toLocaleDateString("ru-RU")}`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyMatchCancelled(telegramId, match) {
  const dateStr = new Date(match.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const timeStr = new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const venue = match.venue?.name || "";
  const approvedCount = match.players?.filter((p) => p.status === "APPROVED").length || 0;
  const text = `❌ <b>Матч отменён</b>\n\n📅 ${dateStr}, ${timeStr}\n📍 ${venue}\n\nПричина: не набралось 4 игрока (было ${approvedCount}/4).`;
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔍 Найти другой матч", web_app: { url: MINI_APP_URL } }],
      ],
    },
  });
}

async function notifyMatchFull(telegramId, match, playerNames) {
  const dateStr = new Date(match.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const timeStr = new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const venue = match.venue?.name || "";
  const text =
    `🎉 <b>Матч собран!</b> 4/4 игрока\n\n` +
    `📍 ${venue}\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `👥 ${playerNames.join(", ")}`;
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть матч", web_app: { url: `${MINI_APP_URL}?match=${match.id}` } }],
      ],
    },
  });
}

async function notifyLeaderboardPosition(telegramId, position, prevPosition, rating) {
  let text;
  if (prevPosition && position < prevPosition) {
    text = `🏆 Ты поднялся на <b>#${position}</b> в рейтинге! (был #${prevPosition})\n📊 Рейтинг: <b>${rating}</b>`;
  } else if (position <= 10) {
    text = `🔥 Ты в <b>топ-10</b>! Позиция: <b>#${position}</b>\n📊 Рейтинг: <b>${rating}</b>`;
  } else if (position <= 3) {
    text = `👑 Ты в <b>топ-3</b>! Позиция: <b>#${position}</b>\n📊 Рейтинг: <b>${rating}</b>`;
  } else {
    return; // Don't notify for positions > 10 without improvement
  }
  await sendTelegramMessage(telegramId, text);
}

async function notifyInactivePlayer(telegramId, firstName, availableMatches) {
  let text = `👋 <b>${firstName}</b>, давно не играли!\n\n`;
  if (availableMatches > 0) {
    text += `🎾 Сейчас доступно <b>${availableMatches}</b> матчей — присоединяйся!`;
  } else {
    text += `Создай матч и позови друзей! 🎾`;
  }
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎾 Открыть Padel GO", web_app: { url: MINI_APP_URL } }],
      ],
    },
  });
}

async function notifyWeeklySummary(telegramId, data) {
  let text = `📋 <b>Твоя неделя в Padel GO</b>\n\n`;
  text += `🎾 Матчей сыграно: <b>${data.matchesPlayed}</b>\n`;
  if (data.matchesPlayed > 0) {
    text += `✅ Побед: <b>${data.wins}</b> | ❌ Поражений: <b>${data.losses}</b>\n`;
    const sign = data.ratingChange >= 0 ? "+" : "";
    text += `📊 Рейтинг: <b>${data.currentRating}</b> (${sign}${data.ratingChange} за неделю)\n`;
  }
  if (data.position) {
    text += `🏆 Позиция: <b>#${data.position}</b>`;
    if (data.positionChange) {
      const arrow = data.positionChange > 0 ? `↓${data.positionChange}` : `↑${Math.abs(data.positionChange)}`;
      text += ` (${arrow})`;
    }
    text += `\n`;
  }
  if (data.newAchievements > 0) {
    text += `🏅 Новых достижений: <b>${data.newAchievements}</b>\n`;
  }
  text += `\nУдачной недели! 💪`;
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть профиль", web_app: { url: MINI_APP_URL } }],
      ],
    },
  });
}

async function notifyMilestone(telegramId, milestone) {
  const text = `🎯 <b>Padel GO — майлстоун!</b>\n\n${milestone}`;
  await sendTelegramMessage(telegramId, text);
}

// ─── Training Session Notifications ───

async function notifyTrainingReminder(telegramId, session, minutesBefore) {
  const sessionDate = new Date(session.date);
  const timeStr = sessionDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = sessionDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  let timeLabel;
  if (minutesBefore >= 60) {
    const hours = Math.floor(minutesBefore / 60);
    const mins = minutesBefore % 60;
    timeLabel = mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  } else {
    timeLabel = `${minutesBefore} мин`;
  }

  const typeLabel = session.type === "GROUP" ? "Групповая" : "Индивидуальная";
  const text =
    `⏰ <b>Напоминание о тренировке!</b>\n\n` +
    `Через <b>${timeLabel}</b> у вас ${typeLabel.toLowerCase()} тренировка:\n` +
    `👨‍🏫 ${session.coach?.firstName || "Тренер"}\n` +
    `📍 ${session.venue?.name || "—"}\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `⏱ ${session.durationMin} мин`;
  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть приложение", web_app: { url: MINI_APP_URL } }],
      ],
    },
  });
}

async function notifyTrainingBooked(telegramId, session, student) {
  const sessionDate = new Date(session.date);
  const timeStr = sessionDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = sessionDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const typeLabel = session.type === "GROUP" ? "групповую" : "индивидуальную";
  const text =
    `📝 <b>${student.firstName} ${student.lastName || ""}</b> записался на ${typeLabel} тренировку\n\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `📍 ${session.venue?.name || "—"}`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyTrainingCancelledByCoach(telegramId, session, coachName) {
  const sessionDate = new Date(session.date);
  const timeStr = sessionDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = sessionDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const text =
    `❌ <b>Тренировка отменена</b>\n\n` +
    `Тренер ${coachName} отменил тренировку:\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `📍 ${session.venue?.name || "—"}`;
  await sendTelegramMessage(telegramId, text);
}

async function notifyTrainingCancelledByStudent(telegramId, session, student) {
  const sessionDate = new Date(session.date);
  const timeStr = sessionDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dateStr = sessionDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const text =
    `⚠️ <b>${student.firstName} ${student.lastName || ""}</b> отменил запись на тренировку\n\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `📍 ${session.venue?.name || "—"}`;
  await sendTelegramMessage(telegramId, text);
}

// ─── Notes & Homework Notifications ───

async function notifyHomework(telegramId, coachName, text) {
  const preview = text.length > 100 ? text.substring(0, 100) + "..." : text;
  const msg =
    `📝 <b>Новое домашнее задание</b>\n\n` +
    `👨‍🏫 Тренер: ${coachName}\n` +
    `📋 ${preview}`;
  await sendTelegramMessage(telegramId, msg, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть приложение", web_app: { url: MINI_APP_URL } }],
      ],
    },
  });
}

async function notifyCoachNote(telegramId, coachName, text) {
  const preview = text.length > 100 ? text.substring(0, 100) + "..." : text;
  const msg =
    `📌 <b>Заметка от тренера</b>\n\n` +
    `👨‍🏫 ${coachName}\n` +
    `💬 ${preview}`;
  await sendTelegramMessage(telegramId, msg);
}

// ─── Tournament Live Notifications ───

async function notifyTournamentStart(telegramId, tournament, matchInfo) {
  let text = `🏆 <b>Турнир начался!</b>\n\n` +
    `<b>${tournament.name}</b>\n` +
    `🎾 Формат: ${tournament.format}\n` +
    `📍 ${tournament.venue?.name || ""}\n`;

  if (matchInfo) {
    text += `\n🎯 <b>Ваш первый матч:</b>\n` +
      `📌 Корт ${matchInfo.court}\n` +
      `👥 ${matchInfo.partner} (ваш партнёр)\n` +
      `⚔️ vs ${matchInfo.opponents}`;
  }

  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть турнир", web_app: { url: `${MINI_APP_URL}?tournament=${tournament.id}` } }],
      ],
    },
  });
}

async function notifyNextRound(telegramId, tournament, roundNumber, matchInfo) {
  let text = `🔔 <b>Раунд ${roundNumber}!</b>\n\n` +
    `🏆 ${tournament.name}\n`;

  if (matchInfo) {
    text += `\n📌 Корт ${matchInfo.court}\n` +
      `👥 Партнёр: ${matchInfo.partner}\n` +
      `⚔️ vs ${matchInfo.opponents}`;
  } else {
    text += `\n⏸️ Этот раунд вы отдыхаете`;
  }

  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Открыть турнир", web_app: { url: `${MINI_APP_URL}?tournament=${tournament.id}` } }],
      ],
    },
  });
}

async function notifyTournamentComplete(telegramId, tournament, position, ratingChange) {
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "🏅";
  const sign = ratingChange >= 0 ? "+" : "";

  let text = `🏁 <b>Турнир завершён!</b>\n\n` +
    `🏆 ${tournament.name}\n` +
    `${medal} Ваше место: <b>#${position}</b>\n` +
    `📊 Рейтинг: <b>${sign}${ratingChange}</b>`;

  if (position <= 3) {
    text += `\n\n🎉 Поздравляем с подиумом!`;
  }

  await sendTelegramMessage(telegramId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📱 Смотреть результаты", web_app: { url: `${MINI_APP_URL}?tournament=${tournament.id}` } }],
      ],
    },
  });
}

module.exports = {
  sendTelegramMessage,
  notifyScoreConfirmation,
  notifyRatingChange,
  notifyNewAchievement,
  notifyMatchReminder,
  notifyNewMatchInArea,
  notifyTournamentOpen,
  notifyMatchCancelled,
  notifyMatchFull,
  notifyLeaderboardPosition,
  notifyInactivePlayer,
  notifyWeeklySummary,
  notifyMilestone,
  // Training
  notifyTrainingReminder,
  notifyTrainingBooked,
  notifyTrainingCancelledByCoach,
  notifyTrainingCancelledByStudent,
  // Notes
  notifyHomework,
  notifyCoachNote,
  // Tournament live
  notifyTournamentStart,
  notifyNextRound,
  notifyTournamentComplete,
};
