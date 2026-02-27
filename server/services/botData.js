/**
 * Bot data helpers — provides DB queries for bot commands.
 * Uses Prisma directly (bot runs in same process as server).
 */
const { PrismaClient } = require("@prisma/client");
const { CITY_MAP, LEVELS, XP_LEVELS } = require("../config/app");
const { sendTelegramMessage, notifyMatchFull } = require("./notifications");

const prisma = new PrismaClient();

function getLevelInfo(rating) {
  for (const l of LEVELS) {
    if (rating >= l.min && rating <= l.max) return l;
  }
  return LEVELS[0];
}

function getLevelByValue(levelFloat) {
  for (const l of LEVELS) {
    if (Math.abs(l.level - levelFloat) < 0.01) return l;
  }
  return LEVELS[0];
}

function getXpLevelInfo(xp) {
  let current = XP_LEVELS[0];
  for (const l of XP_LEVELS) {
    if (xp >= l.min) current = l;
  }
  return current;
}

// ─── /me ───────────────────────────────────────────
async function getUserProfile(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    include: {
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
        take: 5,
      },
    },
  });
  if (!user) return null;

  const higherCount = await prisma.user.count({
    where: { rating: { gt: user.rating } },
  });
  const position = higherCount + 1;
  const totalPlayers = await prisma.user.count();
  const level = getLevelInfo(user.rating);
  const xpLevel = getXpLevelInfo(user.xp || 0);

  const upcomingCount = await prisma.matchPlayer.count({
    where: {
      userId: user.id,
      status: "APPROVED",
      match: { date: { gt: new Date() }, status: { in: ["RECRUITING", "FULL"] } },
    },
  });

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city,
    rating: user.rating,
    matchesPlayed: user.matchesPlayed,
    wins: user.wins,
    losses: user.losses,
    winStreak: user.winStreak,
    maxWinStreak: user.maxWinStreak,
    xp: user.xp || 0,
    isVip: user.isVip,
    position,
    totalPlayers,
    level,
    xpLevel,
    upcomingCount,
    achievements: user.achievements.map((ua) => ({
      icon: ua.achievement.icon,
      name: ua.achievement.name,
    })),
  };
}

// ─── /top ──────────────────────────────────────────
async function getLeaderboard(limit = 10, telegramId = null) {
  const users = await prisma.user.findMany({
    where: { matchesPlayed: { gt: 0 } },
    orderBy: { rating: "desc" },
    take: limit,
    select: {
      id: true,
      firstName: true,
      rating: true,
      wins: true,
      losses: true,
      matchesPlayed: true,
      city: true,
      telegramId: true,
    },
  });

  // If caller not in top N, find their position too
  let callerPosition = null;
  if (telegramId) {
    const caller = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true, firstName: true, rating: true, wins: true, losses: true, matchesPlayed: true },
    });
    if (caller && caller.matchesPlayed > 0) {
      const above = await prisma.user.count({ where: { rating: { gt: caller.rating } } });
      callerPosition = {
        position: above + 1,
        firstName: caller.firstName,
        rating: caller.rating,
        wins: caller.wins,
        losses: caller.losses,
      };
    }
  }

  return { users, callerPosition };
}

// ─── /matches (my upcoming) ───────────────────────
async function getUserMatches(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true },
  });
  if (!user) return [];

  const matchPlayers = await prisma.matchPlayer.findMany({
    where: {
      userId: user.id,
      status: "APPROVED",
      match: {
        date: { gt: new Date() },
        status: { in: ["RECRUITING", "FULL"] },
      },
    },
    include: {
      match: {
        include: {
          venue: true,
          players: {
            where: { status: "APPROVED" },
            include: { user: { select: { firstName: true } } },
          },
        },
      },
    },
    orderBy: { match: { date: "asc" } },
    take: 10,
  });

  return matchPlayers.map((mp) => ({
    matchId: mp.match.id,
    date: mp.match.date,
    durationMin: mp.match.durationMin,
    venue: mp.match.venue?.name || "—",
    status: mp.match.status,
    playerCount: mp.match.players.length,
    playerNames: mp.match.players.map((p) => p.user.firstName),
  }));
}

// ─── /find (available matches) ────────────────────
async function getAvailableMatches(telegramId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true, city: true, rating: true },
  });

  const where = {
    status: "RECRUITING",
    date: { gt: new Date() },
  };

  // If user is registered, filter by city
  if (user) {
    where.venue = { city: user.city };
  }

  const matches = await prisma.match.findMany({
    where,
    include: {
      venue: true,
      players: {
        where: { status: "APPROVED" },
        include: { user: { select: { id: true, firstName: true } } },
      },
    },
    orderBy: { date: "asc" },
    take: 10,
  });

  // Filter out matches where user is already a player
  const userId = user?.id;
  return matches
    .filter((m) => !userId || !m.players.some((p) => p.user.id === userId))
    .map((m) => ({
      matchId: m.id,
      date: m.date,
      durationMin: m.durationMin,
      venue: m.venue?.name || "—",
      levelMin: m.levelMin,
      levelMax: m.levelMax,
      playerCount: m.players.length,
      playerNames: m.players.map((p) => p.user.firstName),
    }));
}

// ─── Join match via bot ───────────────────────────
async function botJoinMatch(telegramId, matchId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
  if (!user) return { error: "Вы не зарегистрированы. Откройте приложение через /start" };

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true, venue: true },
  });
  if (!match) return { error: "Матч не найден" };
  if (match.status !== "RECRUITING") return { error: "Набор в этот матч закрыт" };
  if (match.players.some((p) => p.userId === user.id)) return { error: "Вы уже подали заявку" };

  const approved = match.players.filter((p) => p.status === "APPROVED");
  if (approved.length >= 4) return { error: "Матч уже полный" };

  // Create pending request
  await prisma.matchPlayer.create({
    data: { matchId, userId: user.id, team: null, status: "PENDING" },
  });

  // Notify match creator
  const creator = await prisma.user.findUnique({ where: { id: match.creatorId } });
  if (creator && creator.telegramId && creator.id !== user.id) {
    const joinerName = user.firstName + (user.lastName ? ` ${user.lastName}` : "");
    const venueName = match.venue?.name || "";
    const dateStr = new Date(match.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    const timeStr = new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const text = `🎾 <b>Новая заявка на матч!</b>\n👤 ${joinerName} (рейтинг: ${user.rating})\n📍 ${venueName}\n📅 ${dateStr} в ${timeStr}`;
    await sendTelegramMessage(creator.telegramId.toString(), text, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Принять", callback_data: `approve_join_${matchId}_${user.id}` },
            { text: "❌ Отклонить", callback_data: `reject_join_${matchId}_${user.id}` },
          ],
        ],
      },
    });
  }

  return { success: true, autoApprove: false };
}

// ─── Leave match via bot ──────────────────────────
async function botLeaveMatch(telegramId, matchId) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
    select: { id: true, firstName: true },
  });
  if (!user) return { error: "Вы не зарегистрированы" };

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true, venue: true },
  });
  if (!match) return { error: "Матч не найден" };
  if (!["RECRUITING", "FULL"].includes(match.status)) {
    return { error: "Нельзя покинуть матч в текущем статусе" };
  }

  const player = match.players.find((p) => p.userId === user.id);
  if (!player) return { error: "Вы не в этом матче" };

  // If creator leaves — cancel the entire match
  if (user.id === match.creatorId) {
    return { error: "Создатель не может покинуть матч через бота. Используйте приложение." };
  }

  await prisma.matchPlayer.delete({ where: { id: player.id } });

  // If match was FULL, reopen
  if (match.status === "FULL" && player.status === "APPROVED") {
    await prisma.match.update({ where: { id: matchId }, data: { status: "RECRUITING" } });
  }

  // Notify creator
  const creator = await prisma.user.findUnique({ where: { id: match.creatorId } });
  if (creator?.telegramId) {
    const text = `👋 <b>${user.firstName}</b> покинул матч #${matchId}`;
    sendTelegramMessage(creator.telegramId.toString(), text).catch(() => {});
  }

  return { success: true };
}

// ─── Create match via bot ─────────────────────────
async function getVenuesByCity(city) {
  return prisma.venue.findMany({
    where: { city },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

async function getAllCitiesWithVenues() {
  const venues = await prisma.venue.groupBy({
    by: ["city"],
    _count: { id: true },
  });
  return venues
    .filter((v) => v._count.id > 0)
    .map((v) => ({ city: v.city, name: CITY_MAP[v.city] || v.city, count: v._count.id }));
}

async function botCreateMatch(telegramId, data) {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
  if (!user) return { error: "Вы не зарегистрированы" };

  const matchDate = new Date(data.date);
  if (matchDate <= new Date()) {
    return { error: "Дата матча в прошлом" };
  }

  const match = await prisma.match.create({
    data: {
      creatorId: user.id,
      venueId: data.venueId,
      date: matchDate,
      durationMin: data.durationMin || 90,
      levelMin: data.levelMin || 1.0,
      levelMax: data.levelMax || 4.0,
      courtBooked: false,
      matchType: "RATED",
      notes: null,
      players: {
        create: { userId: user.id, team: null },
      },
    },
    include: {
      venue: true,
      players: {
        include: { user: { select: { firstName: true } } },
      },
    },
  });

  return { success: true, match };
}

module.exports = {
  getUserProfile,
  getLeaderboard,
  getUserMatches,
  getAvailableMatches,
  botJoinMatch,
  botLeaveMatch,
  getVenuesByCity,
  getAllCitiesWithVenues,
  botCreateMatch,
  getLevelInfo,
  getLevelByValue,
  CITY_MAP,
  LEVELS,
};
