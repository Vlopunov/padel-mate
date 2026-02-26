const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// List tournaments
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, city } = req.query;
    const where = {};

    if (status === "registration") where.status = "REGISTRATION";
    else if (status === "completed") where.status = "COMPLETED";

    if (city) where.city = city;

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        venue: true,
        registrations: true,
      },
      orderBy: { date: "asc" },
    });

    const result = tournaments.map((t) => ({
      ...t,
      teamsRegistered: t.registrations.length,
    }));

    res.json(result);
  } catch (err) {
    console.error("Tournaments error:", err);
    res.status(500).json({ error: "Ошибка получения турниров" });
  }
});

// Get tournament by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        venue: true,
        registrations: {
          include: {
            player1: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true } },
            player2: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true } },
          },
        },
      },
    });

    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });

    res.json({ ...tournament, teamsRegistered: tournament.registrations.length });
  } catch (err) {
    console.error("Tournament detail error:", err);
    res.status(500).json({ error: "Ошибка получения турнира" });
  }
});

// Register for tournament (pair)
router.post("/:id/register", authMiddleware, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { partnerId } = req.body;

    if (!partnerId) return res.status(400).json({ error: "Укажите партнёра" });

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { registrations: true },
    });

    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });
    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({ error: "Регистрация закрыта" });
    }
    if (tournament.registrations.length >= tournament.maxTeams) {
      return res.status(400).json({ error: "Все места заняты" });
    }

    // Check if either player already registered
    const existing = tournament.registrations.find(
      (r) =>
        r.player1Id === req.userId ||
        r.player2Id === req.userId ||
        r.player1Id === partnerId ||
        r.player2Id === partnerId
    );
    if (existing) {
      return res.status(400).json({ error: "Один из игроков уже зарегистрирован" });
    }

    const reg = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        player1Id: req.userId,
        player2Id: parseInt(partnerId),
      },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, rating: true } },
        player2: { select: { id: true, firstName: true, lastName: true, rating: true } },
      },
    });

    res.json(reg);
  } catch (err) {
    console.error("Tournament register error:", err);
    res.status(500).json({ error: "Ошибка регистрации на турнир" });
  }
});

module.exports = router;
