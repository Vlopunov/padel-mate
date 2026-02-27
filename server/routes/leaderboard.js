const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const { getLevel } = require("../services/rating");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { city, period } = req.query;
    const where = { onboarded: true, isVisible: true };

    if (city && city !== "all") where.city = city;

    let users;

    if (period === "week" || period === "month") {
      const since = new Date();
      if (period === "week") since.setDate(since.getDate() - 7);
      else since.setMonth(since.getMonth() - 1);

      // Get rating changes in period
      const ratingChanges = await prisma.ratingHistory.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since }, reason: { in: ["match_win", "match_loss"] } },
        _sum: { change: true },
      });

      const changeMap = new Map(ratingChanges.map((r) => [r.userId, r._sum.change || 0]));
      const userIds = ratingChanges.map((r) => r.userId);

      users = await prisma.user.findMany({
        where: { ...where, id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          photoUrl: true,
          city: true,
          hand: true,
          rating: true,
          matchesPlayed: true,
          wins: true,
          losses: true,
          isVip: true,
        },
        orderBy: { rating: "desc" },
        take: 100,
      });

      users = users
        .map((u) => ({
          ...u,
          periodChange: changeMap.get(u.id) || 0,
          level: getLevel(u.rating),
        }))
        .sort((a, b) => b.periodChange - a.periodChange);
    } else {
      users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          photoUrl: true,
          city: true,
          hand: true,
          rating: true,
          matchesPlayed: true,
          wins: true,
          losses: true,
          isVip: true,
        },
        orderBy: { rating: "desc" },
        take: 100,
      });

      users = users.map((u) => ({
        ...u,
        level: getLevel(u.rating),
        periodChange: 0,
      }));
    }

    // Get recent trend for each user
    const userIds = users.map((u) => u.id);
    const recentHistory = await prisma.ratingHistory.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["userId"],
    });

    const trendMap = new Map(recentHistory.map((r) => [r.userId, r.change]));

    const result = users.map((u, idx) => ({
      ...u,
      position: idx + 1,
      trend: trendMap.get(u.id) || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Ошибка получения рейтинга" });
  }
});

module.exports = router;
