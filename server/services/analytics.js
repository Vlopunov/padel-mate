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

module.exports = {
  collectDailyStats,
  getDashboardData,
  getTodaySummary,
  formatDigestMessage,
  isAdmin,
};
