const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const { calculateInitialElo, convertExternalRating, getLevel, getXpLevel } = require("../services/rating");
const { checkAndAwardAchievements } = require("../services/achievements");

const router = express.Router();
const prisma = new PrismaClient();

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
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
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

// Manual rating edit
router.patch("/me/rating", authMiddleware, async (req, res) => {
  try {
    const { newRating, reason } = req.body;

    if (!newRating || newRating < 0 || newRating > 5000) {
      return res.status(400).json({ error: "Рейтинг должен быть от 0 до 5000" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    const oldRating = user.rating;

    await prisma.user.update({
      where: { id: req.userId },
      data: { rating: newRating, ratingSource: "manual" },
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
        photoUrl: true, rating: true, city: true,
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

    const matchHistory = await prisma.matchPlayer.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            venue: true,
            sets: { orderBy: { setNumber: "asc" } },
            players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true } } } },
          },
        },
      },
      orderBy: { match: { date: "desc" } },
      take: 20,
    });

    const winRate = user.matchesPlayed > 0 ? Math.min(100, Math.round((user.wins / user.matchesPlayed) * 100)) : 0;

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
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Ошибка получения статистики" });
  }
});

module.exports = router;
