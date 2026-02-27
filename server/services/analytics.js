const { PrismaClient } = require("@prisma/client");
const { CITY_MAP } = require("../config/app");

const prisma = new PrismaClient();

// Minsk is UTC+3 (Belarus has no DST)
const MINSK_OFFSET_MS = 3 * 60 * 60 * 1000;

function getMinskDateStr(date) {
  const minskTime = new Date(date.getTime() + MINSK_OFFSET_MS);
  return minskTime.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/**
 * Collect and upsert daily stats for a given date (defaults to today in Minsk TZ)
 */
async function collectDailyStats(dateOverride) {
  const now = dateOverride || new Date();
  const dateStr = getMinskDateStr(now);

  // Day boundaries in UTC for this Minsk calendar day
  const dayStart = new Date(`${dateStr}T00:00:00+03:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999+03:00`);

  // Total users
  const totalUsers = await prisma.user.count();

  // New users today
  const newUsers = await prisma.user.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });

  // Total matches
  const totalMatches = await prisma.match.count();

  // New matches created today
  const newMatches = await prisma.match.count({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
  });

  // Matches completed today (scheduled for today and finished)
  const completedMatches = await prisma.match.count({
    where: {
      status: "COMPLETED",
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  // Active users: distinct users who played in matches scheduled today
  const activePlayers = await prisma.matchPlayer.findMany({
    where: {
      status: "APPROVED",
      match: { date: { gte: dayStart, lte: dayEnd } },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  const activeUsers = activePlayers.length;

  // Top rating change of the day
  const topChange = await prisma.ratingHistory.findFirst({
    where: { createdAt: { gte: dayStart, lte: dayEnd } },
    orderBy: { change: "desc" },
  });

  // City breakdown
  const cityGroups = await prisma.user.groupBy({
    by: ["city"],
    _count: { id: true },
  });
  const cityCounts = {};
  for (const g of cityGroups) {
    cityCounts[g.city] = g._count.id;
  }

  // Upsert
  const statsDate = new Date(`${dateStr}T00:00:00.000Z`);
  await prisma.dailyStats.upsert({
    where: { date: statsDate },
    update: {
      totalUsers,
      newUsers,
      totalMatches,
      newMatches,
      completedMatches,
      activeUsers,
      topRatingChange: topChange?.change || 0,
      topRatingUserId: topChange?.userId || null,
      cityCounts,
    },
    create: {
      date: statsDate,
      totalUsers,
      newUsers,
      totalMatches,
      newMatches,
      completedMatches,
      activeUsers,
      topRatingChange: topChange?.change || 0,
      topRatingUserId: topChange?.userId || null,
      cityCounts,
    },
  });

  return {
    date: dateStr,
    totalUsers,
    newUsers,
    totalMatches,
    newMatches,
    completedMatches,
    activeUsers,
    topRatingChange: topChange?.change || 0,
    topRatingUserId: topChange?.userId || null,
    cityCounts,
  };
}

/**
 * Get DailyStats array for the last N days (for charts)
 */
async function getDashboardData(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stats = await prisma.dailyStats.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
  });

  return stats;
}

/**
 * Get today + yesterday for comparison
 */
async function getTodaySummary() {
  // Collect/refresh today
  const today = await collectDailyStats();

  // Get yesterday
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yStr = getMinskDateStr(yesterdayDate);
  const yesterday = await prisma.dailyStats.findUnique({
    where: { date: new Date(`${yStr}T00:00:00.000Z`) },
  });

  return { today, yesterday };
}

/**
 * Format a beautiful Telegram HTML digest message
 */
function formatDigestMessage(today, yesterday) {
  const arrow = (current, prev) => {
    if (prev == null) return "";
    if (current > prev) return ` (↑${current - prev})`;
    if (current < prev) return ` (↓${prev - current})`;
    return "";
  };

  const cityLines = Object.entries(today.cityCounts || {})
    .map(([city, count]) => `  ${CITY_MAP[city] || city}: ${count}`)
    .join("\n");

  let text = `📊 <b>Padel GO — сводка за ${today.date}</b>\n\n`;
  text += `👥 Всего игроков: <b>${today.totalUsers}</b>${arrow(today.totalUsers, yesterday?.totalUsers)}\n`;
  text += `🆕 Новых сегодня: <b>${today.newUsers}</b>\n`;
  text += `🎾 Матчей всего: <b>${today.totalMatches}</b>${arrow(today.totalMatches, yesterday?.totalMatches)}\n`;
  text += `📅 Новых матчей: <b>${today.newMatches}</b>\n`;
  text += `✅ Завершено сегодня: <b>${today.completedMatches}</b>\n`;
  text += `🏃 Активных игроков: <b>${today.activeUsers}</b>\n`;

  if (today.topRatingChange > 0) {
    text += `\n📈 Лучший рейтинг-скачок: <b>+${today.topRatingChange}</b>\n`;
  }

  if (cityLines) {
    text += `\n🏙️ По городам:\n${cityLines}\n`;
  }

  return text;
}

/**
 * Check if a Telegram user is admin (used by bot command)
 */
async function isAdmin(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { isAdmin: true },
  });
  return user?.isAdmin === true;
}

/**
 * Get weekly summary for a specific user
 */
async function getUserWeeklySummary(userId) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Matches played this week
  const weekMatches = await prisma.matchPlayer.findMany({
    where: {
      userId,
      status: "APPROVED",
      match: {
        status: "COMPLETED",
        date: { gte: weekAgo, lte: now },
      },
    },
    include: { match: true },
  });

  // Rating changes this week
  const ratingChanges = await prisma.ratingHistory.findMany({
    where: { userId, createdAt: { gte: weekAgo, lte: now } },
    orderBy: { createdAt: "asc" },
  });

  const ratingChange = ratingChanges.reduce((sum, r) => sum + r.change, 0);

  // Current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rating: true, wins: true, losses: true, telegramId: true, firstName: true },
  });

  // Current position
  const higherCount = await prisma.user.count({ where: { rating: { gt: user.rating } } });
  const position = higherCount + 1;

  // Position a week ago (approximate: count users with rating > (current - weekChange))
  const oldRating = user.rating - ratingChange;
  const prevHigherCount = await prisma.user.count({ where: { rating: { gt: oldRating } } });
  const prevPosition = prevHigherCount + 1;
  const positionChange = prevPosition - position; // positive = moved up

  // New achievements this week
  const newAchievements = await prisma.userAchievement.count({
    where: { userId, unlockedAt: { gte: weekAgo, lte: now } },
  });

  // Count wins/losses this week from rating history
  const weekWins = ratingChanges.filter((r) => r.change > 0).length;
  const weekLosses = ratingChanges.filter((r) => r.change < 0).length;

  return {
    telegramId: user.telegramId.toString(),
    firstName: user.firstName,
    matchesPlayed: weekMatches.length,
    wins: weekWins,
    losses: weekLosses,
    ratingChange,
    currentRating: user.rating,
    position,
    positionChange: positionChange !== 0 ? -positionChange : 0, // negative = moved up in display
    newAchievements,
  };
}

/**
 * Get inactive players (no match in last N days)
 */
async function getInactivePlayers(days = 14) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // All users who haven't played in a match since cutoff
  const allUsers = await prisma.user.findMany({
    select: { id: true, telegramId: true, firstName: true, city: true },
  });

  const activeUserIds = await prisma.matchPlayer.findMany({
    where: {
      status: "APPROVED",
      match: { date: { gte: cutoff } },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  const activeSet = new Set(activeUserIds.map((u) => u.userId));

  return allUsers.filter((u) => !activeSet.has(u.id));
}

/**
 * Check for platform milestones
 */
async function checkMilestones() {
  const totalUsers = await prisma.user.count();
  const totalMatches = await prisma.match.count({ where: { status: "COMPLETED" } });

  const milestones = [];
  const userMilestones = [10, 25, 50, 100, 200, 500, 1000];
  const matchMilestones = [10, 25, 50, 100, 250, 500, 1000];

  for (const m of userMilestones) {
    if (totalUsers === m) {
      milestones.push(`👥 <b>${m} игроков</b> зарегистрировано на платформе! 🎉`);
    }
  }
  for (const m of matchMilestones) {
    if (totalMatches === m) {
      milestones.push(`🎾 <b>${m} матчей</b> сыграно на платформе! 🎉`);
    }
  }

  return milestones;
}

/**
 * Format admin weekly report
 */
function formatWeeklyReport(weekData) {
  const { totalUsers, newUsers, totalMatches, newMatches, activeUsers, topPlayer, cityCounts } = weekData;

  let text = `📈 <b>Padel GO — еженедельный отчёт</b>\n\n`;
  text += `👥 Игроков: <b>${totalUsers}</b> (+${newUsers} за неделю)\n`;
  text += `🎾 Матчей: <b>${totalMatches}</b> (+${newMatches} за неделю)\n`;
  text += `🏃 Активных игроков: <b>${activeUsers}</b>\n`;

  if (topPlayer) {
    text += `\n⭐ Самый активный: <b>${topPlayer.name}</b> (${topPlayer.matches} матчей)\n`;
  }

  const cityLines = Object.entries(cityCounts || {})
    .map(([city, count]) => `  ${CITY_MAP[city] || city}: ${count}`)
    .join("\n");
  if (cityLines) {
    text += `\n🏙️ По городам:\n${cityLines}\n`;
  }

  text += `\nХорошей недели! 🚀`;
  return text;
}

/**
 * Collect weekly data for admin report
 */
async function getWeeklyReportData() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalUsers = await prisma.user.count();
  const newUsers = await prisma.user.count({ where: { createdAt: { gte: weekAgo } } });
  const totalMatches = await prisma.match.count({ where: { status: "COMPLETED" } });
  const newMatches = await prisma.match.count({ where: { createdAt: { gte: weekAgo } } });

  // Active users this week
  const activePlayers = await prisma.matchPlayer.findMany({
    where: {
      status: "APPROVED",
      match: { date: { gte: weekAgo, lte: now } },
    },
    select: { userId: true },
    distinct: ["userId"],
  });
  const activeUsers = activePlayers.length;

  // Most active player
  const playerCounts = {};
  const weekMatchPlayers = await prisma.matchPlayer.findMany({
    where: {
      status: "APPROVED",
      match: { date: { gte: weekAgo, lte: now }, status: "COMPLETED" },
    },
    include: { user: { select: { firstName: true } } },
  });
  for (const p of weekMatchPlayers) {
    playerCounts[p.userId] = playerCounts[p.userId] || { name: p.user.firstName, matches: 0 };
    playerCounts[p.userId].matches++;
  }
  const topPlayer = Object.values(playerCounts).sort((a, b) => b.matches - a.matches)[0] || null;

  // City breakdown
  const cityGroups = await prisma.user.groupBy({ by: ["city"], _count: { id: true } });
  const cityCounts = {};
  for (const g of cityGroups) {
    cityCounts[g.city] = g._count.id;
  }

  return { totalUsers, newUsers, totalMatches, newMatches, activeUsers, topPlayer, cityCounts };
}

module.exports = {
  collectDailyStats,
  getDashboardData,
  getTodaySummary,
  formatDigestMessage,
  isAdmin,
  getUserWeeklySummary,
  getInactivePlayers,
  checkMilestones,
  getWeeklyReportData,
  formatWeeklyReport,
};
