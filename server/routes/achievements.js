const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// All achievements
router.get("/", authMiddleware, async (req, res) => {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ category: "asc" }, { xp: "asc" }],
    });
    res.json(achievements);
  } catch (err) {
    console.error("Achievements error:", err);
    res.status(500).json({ error: "Ошибка получения достижений" });
  }
});

// My achievements
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: req.userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" },
    });

    res.json(userAchievements.map((ua) => ({
      ...ua.achievement,
      unlockedAt: ua.unlockedAt,
    })));
  } catch (err) {
    console.error("My achievements error:", err);
    res.status(500).json({ error: "Ошибка получения достижений" });
  }
});

module.exports = router;
