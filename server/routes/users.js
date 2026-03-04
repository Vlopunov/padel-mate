const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { calculateInitialElo, convertExternalRating, getLevel, getXpLevel, determineWinner, normalizePairIds } = require("../services/rating");
const { checkAndAwardAchievements } = require("../services/achievements");

const router = express.Router();

function serializeUser(user) {
  return { ...user, telegramId: user.telegramId.toString() };
}

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        achievements: { include: { achievement: true } },
        ratingHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const level = getLevel(user.rating);
    const xpLevel = getXpLevel(user.xp);

    // Recent trend
    const trend = user.ratingHistory.length > 0 ? user.ratingHistory[0].change : 0;

    res.json({
      ...serializeUser(user),
      level: level.level,
      levelCategory: level.category,
      levelName: level.name,
      xpLevel: xpLevel.current,
      xpNext: xpLevel.next,
      xpProgress: xpLevel.progress,
      trend,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Ошибка получения профиля" });
  }
});

// Onboarding
router.post("/onboard", authMiddleware, async (req, res) => {
  try {
    const { city, ratingSource, ratingSystem, ratingValue, surveyAnswers, hand, position } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!existingUser) return res.status(404).json({ error: "Пользователь не найден" });
    if (existingUser.onboarded) return res.status(400).json({ error: "Онбординг уже пройден" });

    if (!city) return res.status(400).json({ error: "Город обязателен" });

    let rating = 1500;
    let source = "survey";

    if (ratingSource === "external" && ratingSystem && ratingValue) {
      rating = convertExternalRating(ratingSystem, ratingValue);
      source = ratingSystem;
    } else if (surveyAnswers && Array.isArray(surveyAnswers)) {
      rating = calculateInitialElo(surveyAnswers);
      source = "survey";
    }

    // Clamp rating to valid range
    rating = Math.max(0, Math.min(5000, rating));

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        city,
        rating,
        ratingSource: source,
        hand: hand || null,
        position: position || null,
        onboarded: true,
      },
    });

    // Create initial rating history (only if not already exists)
    const existingOnboarding = await prisma.ratingHistory.findFirst({
      where: { userId: user.id, reason: "onboarding" },
    });
    if (!existingOnboarding) {
      await prisma.ratingHistory.create({
        data: {
          userId: user.id,
          oldRating: 1500,
          newRating: rating,
          change: rating - 1500,
          reason: "onboarding",
          note: `Начальный рейтинг (${source})`,
        },
      });
    }

    res.json(serializeUser(user));
  } catch (err) {
    console.error("Onboard error:", err);
    res.status(500).json({ error: "Ошибка онбординга" });
  }
});

// Update profile
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    const allowed = ["city", "hand", "position", "experience", "preferredTime", "isVisible", "reminderMinutes"];
    const data = {};
    const VALID_ENUMS = {
      city: ["MINSK", "BREST", "GRODNO"],
      hand: ["RIGHT", "LEFT"],
      position: ["DERECHA", "REVES", "BOTH"],
      experience: ["BEGINNER", "LESS_YEAR", "ONE_THREE", "THREE_PLUS"],
      preferredTime: ["MORNING", "AFTERNOON", "EVENING", "ANY"],
    };
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (VALID_ENUMS[key] && !VALID_ENUMS[key].includes(req.body[key])) {
          return res.status(400).json({ error: `Недопустимое значение для ${key}` });
        }
        if (key === "reminderMinutes") {
          const val = parseInt(req.body[key]);
          if (isNaN(val) || val < 0 || val > 1440) {
            return res.status(400).json({ error: "reminderMinutes должен быть от 0 до 1440" });
          }
          data[key] = val;
          continue;
        }
        data[key] = req.body[key];
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });

    res.json(serializeUser(user));
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

// Manual rating edit (one-time, ±500 max)
router.patch("/me/rating", authMiddleware, async (req, res) => {
  try {
    const { newRating, reason } = req.body;

    if (!newRating || newRating < 0 || newRating > 5000) {
      return res.status(400).json({ error: "Рейтинг должен быть от 0 до 5000" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    if (user.ratingEditUsed) {
      return res.status(403).json({ error: "Вы уже использовали редактирование рейтинга" });
    }

    const oldRating = user.rating;
    const diff = Math.abs(newRating - oldRating);
    if (diff > 500) {
      return res.status(400).json({ error: "Изменение не может превышать 500 Elo" });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { rating: newRating, ratingSource: "manual", ratingEditUsed: true },
    });

    await prisma.ratingHistory.create({
      data: {
        userId: req.userId,
        oldRating,
        newRating,
        change: newRating - oldRating,
        reason: "manual_edit",
        note: reason || "Ручное редактирование",
      },
    });

    res.json({ oldRating, newRating, change: newRating - oldRating });
  } catch (err) {
    console.error("Rating edit error:", err);
    res.status(500).json({ error: "Ошибка обновления рейтинга" });
  }
});

// Search / list users (for inviting to matches)
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { q, city, ratingMin, ratingMax } = req.query;

    const where = {
      onboarded: true,
      isVisible: true,
    };

    // Text search (optional — if empty, returns all)
    if (q && q.trim().length > 0) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ];
    }

    if (city) where.city = city;

    // Rating range filter
    if (ratingMin || ratingMax) {
      where.rating = {};
      if (ratingMin) where.rating.gte = parseInt(ratingMin);
      if (ratingMax) where.rating.lte = parseInt(ratingMax);
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, username: true,
        photoUrl: true, rating: true, city: true, isVip: true,
      },
      orderBy: { rating: "desc" },
      take: 50,
    });

    res.json(users);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Ошибка поиска" });
  }
});

// Get user by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        city: true,
        hand: true,
        position: true,
        experience: true,
        rating: true,
        matchesPlayed: true,
        wins: true,
        losses: true,
        xp: true,
        isVip: true,
      },
    });

    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    const level = getLevel(user.rating);
    res.json({ ...user, level: level.level, levelCategory: level.category, levelName: level.name });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Ошибка получения пользователя" });
  }
});

// Head-to-head stats between two players
router.get("/:id/h2h/:opponentId", authMiddleware, async (req, res) => {
  try {
    const userA = parseInt(req.params.id);
    const userB = parseInt(req.params.opponentId);

    if (req.userId !== userA && req.userId !== userB) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }
    if (userA === userB) {
      return res.json({ totalMatches: 0, asOpponents: { total: 0, wins: 0, losses: 0 }, asTeammates: { total: 0, wins: 0, losses: 0 }, recentMatches: [] });
    }

    const sharedMatches = await prisma.match.findMany({
      where: {
        status: "COMPLETED",
        AND: [
          { players: { some: { userId: userA, status: "APPROVED" } } },
          { players: { some: { userId: userB, status: "APPROVED" } } },
        ],
      },
      include: {
        players: { where: { status: "APPROVED" }, select: { userId: true, team: true } },
        sets: { orderBy: { setNumber: "asc" } },
        venue: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    const asOpponents = { total: 0, wins: 0, losses: 0 };
    const asTeammates = { total: 0, wins: 0, losses: 0 };
    const recentMatches = [];

    for (const match of sharedMatches) {
      const pA = match.players.find(p => p.userId === userA);
      const pB = match.players.find(p => p.userId === userB);
      if (!pA || !pB || pA.team == null || pB.team == null) continue;

      const sameTeam = pA.team === pB.team;
      const winningTeam = determineWinner(match.sets);
      if (!winningTeam) continue;

      const mePlayer = match.players.find(p => p.userId === req.userId);
      if (!mePlayer) continue;
      const won = mePlayer.team === winningTeam;

      if (sameTeam) {
        asTeammates.total++;
        if (won) asTeammates.wins++; else asTeammates.losses++;
      } else {
        asOpponents.total++;
        if (won) asOpponents.wins++; else asOpponents.losses++;
      }

      if (recentMatches.length < 5) {
        const setsStr = match.sets.map(s => {
          let str = `${s.team1Score}:${s.team2Score}`;
          if (s.team1Tiebreak != null && s.team2Tiebreak != null) {
            str += `(${s.team1Tiebreak}:${s.team2Tiebreak})`;
          }
          return str;
        }).join(", ");

        recentMatches.push({
          matchId: match.id,
          date: match.date,
          venue: match.venue?.name || null,
          sameTeam,
          won,
          sets: setsStr,
        });
      }
    }

    res.json({
      totalMatches: asOpponents.total + asTeammates.total,
      asOpponents,
      asTeammates,
      recentMatches,
    });
  } catch (err) {
    console.error("H2H error:", err);
    res.status(500).json({ error: "Ошибка получения статистики" });
  }
});

// User stats
router.get("/:id/stats", authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    // Retroactively check achievements (catches any missed awards)
    try {
      await checkAndAwardAchievements(userId);
      // Re-fetch user to get updated XP
      user = await prisma.user.findUnique({ where: { id: userId } });
    } catch (achErr) {
      console.error("Achievement check error:", achErr);
    }

    const ratingHistory = await prisma.ratingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    // Load completed matches for aggregations (capped at 500 for safety)
    const allMatchPlayers = await prisma.matchPlayer.findMany({
      where: { userId, match: { status: "COMPLETED" }, status: "APPROVED" },
      include: {
        match: {
          include: {
            venue: true,
            sets: { orderBy: { setNumber: "asc" } },
            players: { where: { status: "APPROVED" }, include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, isVip: true } } } },
          },
        },
      },
      orderBy: { match: { date: "desc" } },
      take: 500,
    });

    // Recent 20 for display (includes non-completed too)
    const matchHistory = await prisma.matchPlayer.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            venue: true,
            sets: { orderBy: { setNumber: "asc" } },
            players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, isVip: true } } } },
          },
        },
      },
      orderBy: { match: { date: "desc" } },
      take: 20,
    });

    const winRate = user.matchesPlayed > 0 ? Math.min(100, Math.round((user.wins / user.matchesPlayed) * 100)) : 0;

    // --- Aggregations from completed matches ---

    // Monthly stats (last 6 months)
    const monthlyMap = {};
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { month: key, matches: 0, wins: 0, losses: 0, ratingChange: 0 };
    }

    // Use ratingHistory for monthly W/L and ratingChange
    const allRatingHistory = await prisma.ratingHistory.findMany({
      where: { userId, reason: { in: ["match_win", "match_loss"] } },
      orderBy: { createdAt: "desc" },
    });

    for (const rh of allRatingHistory) {
      const d = new Date(rh.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].matches++;
        if (rh.reason === "match_win") monthlyMap[key].wins++;
        else monthlyMap[key].losses++;
        monthlyMap[key].ratingChange += rh.change;
      }
    }

    const monthlyStats = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Top partners (teammates with best win rate, min 2 matches)
    const partnerMap = {};
    for (const mp of allMatchPlayers) {
      if (mp.team == null) continue;
      const winner = determineWinner(mp.match.sets);
      if (!winner) continue;
      const won = mp.team === winner;
      const teammates = mp.match.players.filter(p => p.team === mp.team && p.user.id !== userId);
      for (const tm of teammates) {
        if (!partnerMap[tm.user.id]) {
          partnerMap[tm.user.id] = { userId: tm.user.id, firstName: tm.user.firstName, photoUrl: tm.user.photoUrl, matches: 0, wins: 0 };
        }
        partnerMap[tm.user.id].matches++;
        if (won) partnerMap[tm.user.id].wins++;
      }
    }
    const topPartners = Object.values(partnerMap)
      .filter(p => p.matches >= 2)
      .map(p => ({ ...p, winRate: Math.round((p.wins / p.matches) * 100) }))
      .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches)
      .slice(0, 3);

    // Day of week & time of day stats
    const dayOfWeekStats = {};
    const timeOfDayStats = { morning: { matches: 0, wins: 0 }, afternoon: { matches: 0, wins: 0 }, evening: { matches: 0, wins: 0 } };

    for (const mp of allMatchPlayers) {
      if (mp.team == null) continue;
      const winner = determineWinner(mp.match.sets);
      if (!winner) continue;
      const won = mp.team === winner;
      const d = new Date(mp.match.date);
      const day = d.getDay();
      if (!dayOfWeekStats[day]) dayOfWeekStats[day] = { matches: 0, wins: 0 };
      dayOfWeekStats[day].matches++;
      if (won) dayOfWeekStats[day].wins++;

      const hour = d.getHours();
      const period = hour >= 6 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
      timeOfDayStats[period].matches++;
      if (won) timeOfDayStats[period].wins++;
    }

    // Enrich topPartners with pair rating (batch query)
    if (topPartners.length > 0) {
      const pairConditions = topPartners.map(tp => {
        const [p1, p2] = normalizePairIds(userId, tp.userId);
        return { player1Id: p1, player2Id: p2 };
      });
      const partnerPairs = await prisma.pair.findMany({
        where: { OR: pairConditions },
      });
      const pairMap = new Map(partnerPairs.map(p => [`${p.player1Id}_${p.player2Id}`, p]));
      for (const tp of topPartners) {
        const [p1, p2] = normalizePairIds(userId, tp.userId);
        const pair = pairMap.get(`${p1}_${p2}`);
        tp.pairRating = pair?.rating || null;
        tp.pairMatchesPlayed = pair?.matchesPlayed || 0;
      }
    }

    // My pairs (all pairs sorted by rating)
    const pairs = await prisma.pair.findMany({
      where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true, isVip: true } },
        player2: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true, isVip: true } },
        ratingHistory: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { rating: "desc" },
    });

    const myPairs = pairs.map((p) => {
      const isPlayer1 = p.player1Id === userId;
      const partner = isPlayer1 ? p.player2 : p.player1;
      return {
        pairId: p.id,
        partnerId: partner.id,
        partnerFirstName: partner.firstName,
        partnerPhotoUrl: partner.photoUrl,
        partnerRating: partner.rating,
        partnerIsVip: partner.isVip,
        pairRating: p.rating,
        matchesPlayed: p.matchesPlayed,
        wins: p.wins,
        losses: p.losses,
        winRate: p.matchesPlayed > 0 ? Math.round((p.wins / p.matchesPlayed) * 100) : 0,
        winStreak: p.winStreak,
        maxWinStreak: p.maxWinStreak,
        lastChange: p.ratingHistory[0]?.change || null,
      };
    });

    res.json({
      rating: user.rating,
      matchesPlayed: user.matchesPlayed,
      wins: user.wins,
      losses: user.losses,
      winRate,
      winStreak: user.winStreak,
      maxWinStreak: user.maxWinStreak,
      xp: user.xp,
      ratingHistory,
      achievements: achievements.map((a) => a.achievement),
      matchHistory: matchHistory.map((mp) => ({
        ...mp.match,
        myTeam: mp.team,
      })),
      monthlyStats,
      topPartners,
      myPairs,
      dayOfWeekStats,
      timeOfDayStats,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Ошибка получения статистики" });
  }
});

module.exports = router;
