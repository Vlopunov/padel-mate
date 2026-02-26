const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Admin middleware
async function adminMiddleware(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Нет доступа" });
  }
  next();
}

// Stats overview
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalMatches = await prisma.match.count();
    const activeMatches = await prisma.match.count({ where: { status: { in: ["RECRUITING", "FULL"] } } });
    const completedMatches = await prisma.match.count({ where: { status: "COMPLETED" } });
    const totalTournaments = await prisma.tournament.count();

    res.json({ totalUsers, totalMatches, activeMatches, completedMatches, totalTournaments });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// List all users
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { rating: "desc" },
      select: {
        id: true, telegramId: true, firstName: true, lastName: true, username: true,
        city: true, rating: true, matchesPlayed: true, wins: true, losses: true,
        isAdmin: true, onboarded: true, createdAt: true, xp: true,
      },
    });
    res.json(users.map((u) => ({ ...u, telegramId: u.telegramId.toString() })));
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Edit user (rating, admin, city)
router.patch("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { rating, isAdmin, city } = req.body;
    const data = {};
    if (rating !== undefined) data.rating = parseInt(rating);
    if (isAdmin !== undefined) data.isAdmin = isAdmin;
    if (city !== undefined) data.city = city;

    const user = await prisma.user.update({ where: { id: userId }, data });

    if (rating !== undefined) {
      await prisma.ratingHistory.create({
        data: {
          userId,
          oldRating: user.rating,
          newRating: parseInt(rating),
          change: parseInt(rating) - user.rating,
          reason: "admin_edit",
          note: "Изменено админом",
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin edit user error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Delete user
router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await prisma.matchPlayer.deleteMany({ where: { userId } });
    await prisma.scoreConfirmation.deleteMany({ where: { userId } });
    await prisma.ratingHistory.deleteMany({ where: { userId } });
    await prisma.userAchievement.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// List all matches
router.get("/matches", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, rating: true } } } },
      },
      orderBy: { date: "desc" },
      take: 50,
    });
    res.json(matches);
  } catch (err) {
    console.error("Admin matches error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Delete match (admin)
router.delete("/matches/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    await prisma.scoreConfirmation.deleteMany({ where: { matchId } });
    await prisma.matchSet.deleteMany({ where: { matchId } });
    await prisma.matchPlayer.deleteMany({ where: { matchId } });
    await prisma.match.delete({ where: { id: matchId } });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete match error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

module.exports = router;
