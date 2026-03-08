const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { sendTelegramMessage } = require("../services/notifications");
const { getLiveData } = require("../services/tournamentEngine");

const router = express.Router();

// List tournaments
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, regionId } = req.query;
    const where = {};

    if (status === "registration") where.status = "REGISTRATION";
    else if (status === "completed") where.status = "COMPLETED";
    else if (status === "upcoming") where.status = "UPCOMING";
    else if (status === "in_progress") where.status = "IN_PROGRESS";

    if (regionId) where.regionId = parseInt(regionId);

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

// Get tournament live data (rounds, matches, standings)
router.get("/:id/live", authMiddleware, async (req, res) => {
  try {
    const data = await getLiveData(parseInt(req.params.id));
    res.json(data);
  } catch (err) {
    console.error("Tournament live error:", err);
    res.status(500).json({ error: "Ошибка получения live-данных" });
  }
});

// Public tournament data (no auth — for TV display)
router.get("/:id/public", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Некорректный ID" });

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, format: true, date: true, pointsPerMatch: true, venue: { select: { name: true } } },
    });
    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });

    // For not-yet-started tournaments, return basic info
    if (tournament.status === "REGISTRATION" || tournament.status === "UPCOMING") {
      return res.json({
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        format: tournament.format,
        date: tournament.date,
        pointsPerMatch: tournament.pointsPerMatch,
        venue: tournament.venue,
        standings: [],
        rounds: [],
      });
    }

    const data = await getLiveData(id);
    // Strip private data
    delete data.registrations;
    delete data.ratingChanges;
    res.json(data);
  } catch (err) {
    console.error("Tournament public error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Register individually (for Americano/Mexicano)
router.post("/:id/register-individual", authMiddleware, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const userIdInt = req.userId;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });
    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({ error: "Регистрация закрыта" });
    }
    if (tournament.registrationMode !== "INDIVIDUAL") {
      return res.status(400).json({ error: "Этот турнир с парной регистрацией" });
    }

    // Use transaction to prevent race conditions
    const reg = await prisma.$transaction(async (tx) => {
      const regCount = await tx.tournamentRegistration.count({ where: { tournamentId } });
      if (regCount >= tournament.maxTeams) {
        throw new Error("Все места заняты");
      }

      const existing = await tx.tournamentRegistration.findFirst({
        where: { tournamentId, player1Id: userIdInt },
      });
      if (existing) {
        throw new Error("Вы уже зарегистрированы");
      }

      return tx.tournamentRegistration.create({
        data: { tournamentId, player1Id: userIdInt },
        include: {
          player1: { select: { id: true, firstName: true, lastName: true, rating: true } },
        },
      });
    });

    res.json(reg);
  } catch (err) {
    if (err.message === "Все места заняты" || err.message === "Вы уже зарегистрированы") {
      return res.status(400).json({ error: err.message });
    }
    console.error("Tournament individual register error:", err);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// Register for tournament (pair) — uses transaction to prevent race conditions
router.post("/:id/register", authMiddleware, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { partnerId } = req.body;

    if (!partnerId) return res.status(400).json({ error: "Укажите партнёра" });

    const partnerIdInt = parseInt(partnerId);
    if (isNaN(partnerIdInt)) return res.status(400).json({ error: "Некорректный ID партнёра" });
    const userIdInt = req.userId;

    if (partnerIdInt === userIdInt) {
      return res.status(400).json({ error: "Нельзя зарегистрироваться с самим собой" });
    }

    const reg = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          registrations: {
            include: {
              player1: { select: { id: true, firstName: true } },
              player2: { select: { id: true, firstName: true } },
            },
          },
        },
      });

      if (!tournament) throw new Error("NOT_FOUND:Турнир не найден");
      if (tournament.status !== "REGISTRATION") {
        throw new Error("BAD:Регистрация закрыта");
      }
      if (tournament.registrations.length >= tournament.maxTeams) {
        throw new Error("BAD:Все места заняты");
      }

      const myExisting = tournament.registrations.find(
        (r) => r.player1Id === userIdInt || r.player2Id === userIdInt
      );
      if (myExisting) {
        throw new Error("BAD:Вы уже зарегистрированы на этот турнир");
      }

      const partnerExisting = tournament.registrations.find(
        (r) => r.player1Id === partnerIdInt || r.player2Id === partnerIdInt
      );
      if (partnerExisting) {
        const partnerName = partnerExisting.player1Id === partnerIdInt
          ? partnerExisting.player1?.firstName
          : partnerExisting.player2?.firstName;
        throw new Error(`BAD:${partnerName || 'Партнёр'} уже зарегистрирован на этот турнир`);
      }

      return tx.tournamentRegistration.create({
        data: {
          tournamentId,
          player1Id: userIdInt,
          player2Id: partnerIdInt,
        },
        include: {
          player1: { select: { id: true, firstName: true, lastName: true, rating: true, telegramId: true } },
          player2: { select: { id: true, firstName: true, lastName: true, rating: true, telegramId: true } },
        },
      });
    });

    // Notify partner via Telegram (outside transaction)
    try {
      const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      if (tournament) {
        const dateStr = new Date(tournament.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Minsk" });
        const text =
          `🏆 <b>${reg.player1.firstName}</b> записал вас на турнир!\n\n` +
          `<b>${tournament.name}</b>\n` +
          `📅 ${dateStr}\n` +
          `Ваша пара: ${reg.player1.firstName} & ${reg.player2.firstName}`;
        await sendTelegramMessage(reg.player2.telegramId.toString(), text);
      }
    } catch (notifErr) {
      console.error("Tournament registration notification error:", notifErr);
    }

    res.json(reg);
  } catch (err) {
    if (err.message?.startsWith("NOT_FOUND:")) {
      return res.status(404).json({ error: err.message.slice(10) });
    }
    if (err.message?.startsWith("BAD:")) {
      return res.status(400).json({ error: err.message.slice(4) });
    }
    console.error("Tournament register error:", err);
    res.status(500).json({ error: "Ошибка регистрации на турнир" });
  }
});

// Unregister from tournament
router.delete("/:id/unregister", authMiddleware, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });
    if (tournament.status !== "REGISTRATION") {
      return res.status(400).json({ error: "Регистрация закрыта, отмена невозможна" });
    }

    // Find registration where user is player1 or player2
    const reg = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId,
        OR: [{ player1Id: req.userId }, { player2Id: req.userId }],
      },
      include: {
        player1: { select: { id: true, firstName: true, telegramId: true } },
        player2: { select: { id: true, firstName: true, telegramId: true } },
      },
    });

    if (!reg) {
      return res.status(400).json({ error: "Вы не зарегистрированы на этот турнир" });
    }

    await prisma.tournamentRegistration.delete({ where: { id: reg.id } });

    // Notify partner
    try {
      const partnerId = reg.player1Id === req.userId ? reg.player2 : reg.player1;
      const canceller = reg.player1Id === req.userId ? reg.player1 : reg.player2;
      if (partnerId && partnerId.telegramId) {
        const text =
          `❌ <b>${canceller.firstName}</b> отменил запись на турнир <b>${tournament.name}</b>.\n` +
          `Вы можете записаться снова с другим партнёром.`;
        await sendTelegramMessage(partnerId.telegramId.toString(), text);
      }
    } catch (notifErr) {
      console.error("Tournament unregister notification error:", notifErr);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Tournament unregister error:", err);
    res.status(500).json({ error: "Ошибка отмены регистрации" });
  }
});

module.exports = router;
