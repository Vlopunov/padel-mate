/**
 * MAX Messenger notification service.
 * Mirror of notifications.js but sends via MAX Bot API instead of Telegram.
 *
 * MAX API: POST https://platform-api.max.ru/messages
 * Auth: Authorization header with bot token
 */

const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://your-domain.com";
const MAX_API_BASE = "https://platform-api.max.ru";

const TZ = "Europe/Minsk";
const fmtTime = (d) => new Date(d).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const fmtDateLong = (d) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: TZ });
const fmtDateShort = (d) => new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: TZ });

// ─── Helper: build inline keyboard attachment ────
function inlineKeyboard(buttons) {
  return {
    type: "inline_keyboard",
    payload: { buttons },
  };
}

function callbackButton(text, payload) {
  return { type: "callback", text, payload };
}

function linkButton(text, url) {
  return { type: "link", text, url };
}

// ─── Core send function via MAX API ──────────────
async function sendMaxMessage(userId, text, options = {}) {
  if (!MAX_BOT_TOKEN) {
    console.log(`[MAX Notification] Would send to ${userId}: ${text}`);
    return;
  }

  try {
    const body = {
      text,
      format: "html",
    };

    if (options.attachments) {
      body.attachments = options.attachments;
    }

    const res = await fetch(`${MAX_API_BASE}/messages?user_id=${userId}`, {
      method: "POST",
      headers: {
        Authorization: MAX_BOT_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`MAX API error: ${res.status}`);
    }
  } catch (err) {
    console.error("Failed to send MAX notification:", err.message);
  }
}

// ─── Notification Functions ──────────────────────

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

  const keyboard = inlineKeyboard([
    [
      callbackButton("✅ Подтвердить", `confirm_score_${match.id}`),
      callbackButton("❌ Оспорить", `dispute_score_${match.id}`),
    ],
  ]);

  return { text, attachments: [keyboard] };
}

async function notifyRatingChange(maxUserId, oldRating, newRating, change) {
  const emoji = change > 0 ? "📈" : "📉";
  const sign = change > 0 ? "+" : "";
  const text = `${emoji} <b>Рейтинг обновлён:</b> ${oldRating} → ${newRating} (${sign}${change})`;
  await sendMaxMessage(maxUserId, text);
}

async function notifyNewAchievement(maxUserId, achievement) {
  const text = `🏅 <b>Новое достижение:</b> ${achievement.icon} ${achievement.name}\n+${achievement.xp} XP`;
  await sendMaxMessage(maxUserId, text);
}

async function notifyMatchReminder(maxUserId, match, minutesBefore) {
  const timeStr = fmtTime(match.date);
  const dateStr = fmtDateLong(match.date);

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

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть матч", `${MINI_APP_URL}?match=${match.id}`)],
    ])],
  });
}

async function notifyNewMatchInArea(maxUserId, match) {
  const dateStr = fmtDateShort(match.date);
  const timeStr = fmtTime(match.date);
  const spots = 4 - (match.approvedCount || 0);
  const text =
    `🎾 Появился матч вашего уровня!\n` +
    `📍 ${match.venue.name}\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `🟢 Свободных мест: ${spots}`;

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [callbackButton("➕ Вступить", `bot_join_${match.id}`)],
      [linkButton("📱 Подробнее", `${MINI_APP_URL}?match=${match.id}`)],
    ])],
  });
}

async function notifyTournamentOpen(maxUserId, tournament) {
  const text = `🏆 <b>Открыта запись на турнир:</b> ${tournament.name}\n📅 ${fmtDateLong(tournament.date)}`;
  await sendMaxMessage(maxUserId, text);
}

async function notifyMatchCancelled(maxUserId, match) {
  const dateStr = fmtDateLong(match.date);
  const timeStr = fmtTime(match.date);
  const venue = match.venue?.name || "";
  const approvedCount = match.players?.filter((p) => p.status === "APPROVED").length || 0;
  const text = `❌ <b>Матч отменён</b>\n\n📅 ${dateStr}, ${timeStr}\n📍 ${venue}\n\nПричина: не набралось 4 игрока (было ${approvedCount}/4).`;

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("🔍 Найти другой матч", MINI_APP_URL)],
    ])],
  });
}

async function notifyMatchFull(maxUserId, match, playerNames) {
  const dateStr = fmtDateLong(match.date);
  const timeStr = fmtTime(match.date);
  const venue = match.venue?.name || "";
  const text =
    `🎉 <b>Матч собран!</b> 4/4 игрока\n\n` +
    `📍 ${venue}\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `👥 ${playerNames.join(", ")}`;

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть матч", `${MINI_APP_URL}?match=${match.id}`)],
    ])],
  });
}

async function notifyLeaderboardPosition(maxUserId, position, prevPosition, rating) {
  let text;
  if (prevPosition && position < prevPosition) {
    text = `🏆 Ты поднялся на <b>#${position}</b> в рейтинге! (был #${prevPosition})\n📊 Рейтинг: <b>${rating}</b>`;
  } else if (position <= 3) {
    text = `👑 Ты в <b>топ-3</b>! Позиция: <b>#${position}</b>\n📊 Рейтинг: <b>${rating}</b>`;
  } else if (position <= 10) {
    text = `🔥 Ты в <b>топ-10</b>! Позиция: <b>#${position}</b>\n📊 Рейтинг: <b>${rating}</b>`;
  } else {
    return;
  }
  await sendMaxMessage(maxUserId, text);
}

async function notifyInactivePlayer(maxUserId, firstName, availableMatches) {
  let text = `👋 <b>${firstName}</b>, давно не играли!\n\n`;
  if (availableMatches > 0) {
    text += `🎾 Сейчас доступно <b>${availableMatches}</b> матчей — присоединяйся!`;
  } else {
    text += `Создай матч и позови друзей! 🎾`;
  }
  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("🎾 Открыть Padel GO", MINI_APP_URL)],
    ])],
  });
}

async function notifyWeeklySummary(maxUserId, data) {
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

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть профиль", MINI_APP_URL)],
    ])],
  });
}

async function notifyMilestone(maxUserId, milestone) {
  const text = `🎯 <b>Padel GO — майлстоун!</b>\n\n${milestone}`;
  await sendMaxMessage(maxUserId, text);
}

// ─── Training Session Notifications ───

async function notifyTrainingReminder(maxUserId, session, minutesBefore) {
  const timeStr = fmtTime(session.date);
  const dateStr = fmtDateLong(session.date);

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

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть приложение", MINI_APP_URL)],
    ])],
  });
}

async function notifyTrainingBooked(maxUserId, session, student) {
  const timeStr = fmtTime(session.date);
  const dateStr = fmtDateLong(session.date);
  const typeLabel = session.type === "GROUP" ? "групповую" : "индивидуальную";
  const text =
    `📝 <b>${student.firstName} ${student.lastName || ""}</b> записался на ${typeLabel} тренировку\n\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `📍 ${session.venue?.name || "—"}`;
  await sendMaxMessage(maxUserId, text);
}

async function notifyTrainingCancelledByCoach(maxUserId, session, coachName) {
  const timeStr = fmtTime(session.date);
  const dateStr = fmtDateLong(session.date);
  const text =
    `❌ <b>Тренировка отменена</b>\n\n` +
    `Тренер ${coachName} отменил тренировку:\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `📍 ${session.venue?.name || "—"}`;
  await sendMaxMessage(maxUserId, text);
}

async function notifyTrainingCancelledByStudent(maxUserId, session, student) {
  const timeStr = fmtTime(session.date);
  const dateStr = fmtDateLong(session.date);
  const text =
    `⚠️ <b>${student.firstName} ${student.lastName || ""}</b> отменил запись на тренировку\n\n` +
    `📅 ${dateStr}, ${timeStr}\n` +
    `📍 ${session.venue?.name || "—"}`;
  await sendMaxMessage(maxUserId, text);
}

// ─── Notes & Homework Notifications ───

async function notifyHomework(maxUserId, coachName, text) {
  const preview = text.length > 100 ? text.substring(0, 100) + "..." : text;
  const msg =
    `📝 <b>Новое домашнее задание</b>\n\n` +
    `👨‍🏫 Тренер: ${coachName}\n` +
    `📋 ${preview}`;
  await sendMaxMessage(maxUserId, msg, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть приложение", MINI_APP_URL)],
    ])],
  });
}

async function notifyCoachNote(maxUserId, coachName, text) {
  const preview = text.length > 100 ? text.substring(0, 100) + "..." : text;
  const msg =
    `📌 <b>Заметка от тренера</b>\n\n` +
    `👨‍🏫 ${coachName}\n` +
    `💬 ${preview}`;
  await sendMaxMessage(maxUserId, msg);
}

// ─── Tournament Live Notifications ───

async function notifyTournamentStart(maxUserId, tournament, matchInfo) {
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

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть турнир", `${MINI_APP_URL}?tournament=${tournament.id}`)],
    ])],
  });
}

async function notifyNextRound(maxUserId, tournament, roundNumber, matchInfo) {
  let text = `🔔 <b>Раунд ${roundNumber}!</b>\n\n` +
    `🏆 ${tournament.name}\n`;

  if (matchInfo) {
    text += `\n📌 Корт ${matchInfo.court}\n` +
      `👥 Партнёр: ${matchInfo.partner}\n` +
      `⚔️ vs ${matchInfo.opponents}`;
  } else {
    text += `\n⏸️ Этот раунд вы отдыхаете`;
  }

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Открыть турнир", `${MINI_APP_URL}?tournament=${tournament.id}`)],
    ])],
  });
}

async function notifyTournamentComplete(maxUserId, tournament, position, ratingChange) {
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "🏅";
  const sign = ratingChange >= 0 ? "+" : "";

  let text = `🏁 <b>Турнир завершён!</b>\n\n` +
    `🏆 ${tournament.name}\n` +
    `${medal} Ваше место: <b>#${position}</b>\n` +
    `📊 Рейтинг: <b>${sign}${ratingChange}</b>`;

  if (position <= 3) {
    text += `\n\n🎉 Поздравляем с подиумом!`;
  }

  await sendMaxMessage(maxUserId, text, {
    attachments: [inlineKeyboard([
      [linkButton("📱 Смотреть результаты", `${MINI_APP_URL}?tournament=${tournament.id}`)],
    ])],
  });
}

module.exports = {
  sendMaxMessage,
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
