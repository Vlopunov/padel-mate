const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const { calculateRatingChanges, determineWinner, getLevel } = require("../services/rating");
const { checkAndAwardAchievements, checkEventAchievement } = require("../services/achievements");
const { notifyRatingChange, notifyNewAchievement, sendTelegramMessage, notifyScoreConfirmation } = require("../services/notifications");

const router = express.Router();
const prisma = new PrismaClient();

// Create match
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { venueId, date, durationMin, levelMin, levelMax, courtBooked, matchType, notes } = req.body;

    if (!venueId || !date || !durationMin) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    const match = await prisma.match.create({
      data: {
        creatorId: req.userId,
        venueId: parseInt(venueId),
        date: new Date(date),
        durationMin: parseInt(durationMin),
        levelMin: parseFloat(levelMin) || 1.0,
        levelMax: parseFloat(levelMax) || 4.0,
        courtBooked: courtBooked || false,
        matchType: matchType || "RATED",
        notes: notes || null,
        players: {
          create: { userId: req.userId, team: 1 },
        },
      },
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true } } } },
      },
    });

    res.json(match);
  } catch (err) {
    console.error("Create match error:", err);
    res.status(500).json({ error: "Ошибка создания матча" });
  }
});

// List matches
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, city, level } = req.query;
    const where = {};

    if (status === "recruiting") where.status = "RECRUITING";
    else if (status === "full") where.status = { in: ["FULL", "PENDING_SCORE"] };
    else where.status = { not: "CANCELLED" };

    if (city) where.venue = { city };
    if (level) {
      const lvl = parseFloat(level);
      where.levelMin = { lte: lvl };
      where.levelMax = { gte: lvl };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        venue: true,
        players: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true },
            },
          },
        },
        sets: { orderBy: { setNumber: "asc" } },
      },
      orderBy: { date: "asc" },
    });

    res.json(matches);
  } catch (err) {
    console.error("List matches error:", err);
    res.status(500).json({ error: "Ошибка получения матчей" });
  }
});

// Get match by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        venue: true,
        players: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true },
            },
          },
        },
        sets: { orderBy: { setNumber: "asc" } },
        confirmations: true,
      },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    res.json(match);
  } catch (err) {
    console.error("Get match error:", err);
    res.status(500).json({ error: "Ошибка получения матча" });
  }
});

// Helper: count only approved players
function approvedPlayers(players) {
  return players.filter((p) => p.status === "APPROVED");
}

// Helper: shared approve logic
async function approvePlayerLogic(matchId, userId) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true, venue: true },
  });
  if (!match) return { error: "Матч не найден", status: 404 };

  const player = match.players.find((p) => p.userId === userId);
  if (!player) return { error: "Заявка не найдена", status: 404 };
  if (player.status === "APPROVED") return { error: "Уже одобрен", status: 400 };

  await prisma.matchPlayer.update({
    where: { id: player.id },
    data: { status: "APPROVED" },
  });

  // Check if match is now full (4 approved players)
  const approvedCount = approvedPlayers(match.players).length + 1;
  if (approvedCount >= 4) {
    await prisma.match.update({ where: { id: matchId }, data: { status: "FULL" } });
  }

  // Notify the approved player
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.telegramId) {
    const venueName = match.venue?.name || '';
    const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const timeStr = new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const text = `✅ <b>Вас приняли в матч!</b>\n📍 ${venueName}\n📅 ${dateStr} в ${timeStr}`;
    await sendTelegramMessage(user.telegramId.toString(), text);
  }

  return { success: true };
}

// Helper: shared reject logic
async function rejectPlayerLogic(matchId, userId) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true, venue: true },
  });
  if (!match) return { error: "Матч не найден", status: 404 };

  const player = match.players.find((p) => p.userId === userId);
  if (!player) return { error: "Заявка не найдена", status: 404 };

  await prisma.matchPlayer.delete({ where: { id: player.id } });

  // Notify the rejected player
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.telegramId) {
    const venueName = match.venue?.name || '';
    const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const text = `❌ <b>Заявка отклонена</b>\nМатч: ${venueName}, ${dateStr}`;
    await sendTelegramMessage(user.telegramId.toString(), text);
  }

  return { success: true };
}

// Join match (creates PENDING request)
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true, venue: true },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.status !== "RECRUITING") return res.status(400).json({ error: "Набор закрыт" });
    if (match.players.some((p) => p.userId === req.userId)) {
      return res.status(400).json({ error: "Вы уже подали заявку" });
    }
    const approved = approvedPlayers(match.players);
    if (approved.length >= 4) return res.status(400).json({ error: "Матч уже полный" });

    // Balance teams based on approved players
    const team1Count = approved.filter((p) => p.team === 1).length;
    const team2Count = approved.filter((p) => p.team === 2).length;
    const team = team1Count <= team2Count ? 1 : 2;

    await prisma.matchPlayer.create({
      data: { matchId, userId: req.userId, team, status: "PENDING" },
    });

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true } } } },
      },
    });

    // Notify match creator with approve/reject buttons
    const joiner = await prisma.user.findUnique({ where: { id: req.userId } });
    const creator = await prisma.user.findUnique({ where: { id: match.creatorId } });
    if (creator && creator.telegramId && creator.id !== req.userId) {
      const joinerName = joiner.firstName + (joiner.lastName ? ` ${joiner.lastName}` : '');
      const venueName = match.venue?.name || '';
      const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      const timeStr = new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const text = `🎾 <b>Новая заявка на матч!</b>\n👤 ${joinerName} (рейтинг: ${joiner.rating})\n📍 ${venueName}\n📅 ${dateStr} в ${timeStr}`;
      await sendTelegramMessage(creator.telegramId.toString(), text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Принять", callback_data: `approve_join_${matchId}_${req.userId}` },
              { text: "❌ Отклонить", callback_data: `reject_join_${matchId}_${req.userId}` },
            ],
          ],
        },
      });
    }

    res.json(updated);
  } catch (err) {
    console.error("Join match error:", err);
    res.status(500).json({ error: "Ошибка подачи заявки" });
  }
});

// Approve player (creator only, via frontend)
router.post("/:id/approve/:userId", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.creatorId !== req.userId) return res.status(403).json({ error: "Только создатель может одобрять" });

    const result = await approvePlayerLogic(matchId, userId);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json({ success: true });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "Ошибка одобрения" });
  }
});

// Reject player (creator only, via frontend)
router.post("/:id/reject/:userId", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.creatorId !== req.userId) return res.status(403).json({ error: "Только создатель может отклонять" });

    const result = await rejectPlayerLogic(matchId, userId);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json({ success: true });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Ошибка отклонения" });
  }
});

// Bot-internal approve (authenticated by X-Bot-Token header)
router.post("/:id/bot-approve/:userId", async (req, res) => {
  try {
    const botToken = req.headers["x-bot-token"];
    if (!botToken || botToken !== process.env.BOT_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await approvePlayerLogic(parseInt(req.params.id), parseInt(req.params.userId));
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json({ success: true });
  } catch (err) {
    console.error("Bot approve error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Bot-internal reject (authenticated by X-Bot-Token header)
router.post("/:id/bot-reject/:userId", async (req, res) => {
  try {
    const botToken = req.headers["x-bot-token"];
    if (!botToken || botToken !== process.env.BOT_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = await rejectPlayerLogic(parseInt(req.params.id), parseInt(req.params.userId));
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json({ success: true });
  } catch (err) {
    console.error("Bot reject error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Delete match (only creator)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.creatorId !== req.userId) {
      return res.status(403).json({ error: "Только создатель может удалить матч" });
    }
    if (!["RECRUITING", "FULL"].includes(match.status)) {
      return res.status(400).json({ error: "Нельзя удалить матч в текущем статусе" });
    }

    await prisma.matchPlayer.deleteMany({ where: { matchId } });
    await prisma.match.delete({ where: { id: matchId } });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete match error:", err);
    res.status(500).json({ error: "Ошибка удаления матча" });
  }
});

// Edit match (only creator)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.creatorId !== req.userId) {
      return res.status(403).json({ error: "Только создатель может редактировать матч" });
    }
    if (!["RECRUITING", "FULL"].includes(match.status)) {
      return res.status(400).json({ error: "Нельзя редактировать матч в текущем статусе" });
    }

    const { venueId, date, durationMin, levelMin, levelMax, courtBooked, matchType, notes } = req.body;
    const data = {};
    if (venueId !== undefined) data.venueId = parseInt(venueId);
    if (date !== undefined) data.date = new Date(date);
    if (durationMin !== undefined) data.durationMin = parseInt(durationMin);
    if (levelMin !== undefined) data.levelMin = parseFloat(levelMin);
    if (levelMax !== undefined) data.levelMax = parseFloat(levelMax);
    if (courtBooked !== undefined) data.courtBooked = courtBooked;
    if (matchType !== undefined) data.matchType = matchType;
    if (notes !== undefined) data.notes = notes || null;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true } } } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Edit match error:", err);
    res.status(500).json({ error: "Ошибка редактирования матча" });
  }
});

// Leave match / cancel request (auto-deletes if creator leaves)
router.post("/:id/leave", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (!["RECRUITING", "FULL"].includes(match.status)) {
      return res.status(400).json({ error: "Нельзя покинуть матч в текущем статусе" });
    }

    const player = match.players.find((p) => p.userId === req.userId);
    if (!player) return res.status(400).json({ error: "Вы не в этом матче" });

    // If creator leaves — delete the entire match
    if (req.userId === match.creatorId) {
      await prisma.matchPlayer.deleteMany({ where: { matchId } });
      await prisma.match.delete({ where: { id: matchId } });
      return res.json({ success: true, deleted: true });
    }

    await prisma.matchPlayer.delete({ where: { id: player.id } });

    // If an approved player left a full match, reopen recruiting
    if (match.status === "FULL" && player.status === "APPROVED") {
      await prisma.match.update({ where: { id: matchId }, data: { status: "RECRUITING" } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Leave match error:", err);
    res.status(500).json({ error: "Ошибка выхода из матча" });
  }
});

// Submit score
router.post("/:id/score", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { sets } = req.body;

    if (!sets || !Array.isArray(sets) || sets.length < 1 || sets.length > 3) {
      return res.status(400).json({ error: "Укажите от 1 до 3 сетов" });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: { include: { user: true } } },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (!["FULL", "PENDING_SCORE"].includes(match.status)) {
      return res.status(400).json({ error: "Нельзя записать счёт в текущем статусе" });
    }
    // Only count approved players
    const approvedInMatch = match.players.filter((p) => p.status === "APPROVED");
    if (approvedInMatch.length !== 4) {
      return res.status(400).json({ error: "В матче должно быть 4 одобренных игрока" });
    }

    // Delete existing sets if any
    await prisma.matchSet.deleteMany({ where: { matchId } });

    // Create sets
    for (let i = 0; i < sets.length; i++) {
      await prisma.matchSet.create({
        data: {
          matchId,
          setNumber: i + 1,
          team1Score: parseInt(sets[i].team1Score),
          team2Score: parseInt(sets[i].team2Score),
        },
      });
    }

    // Update match status
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "PENDING_CONFIRMATION" },
    });

    // Create score confirmation for submitter
    await prisma.scoreConfirmation.upsert({
      where: { matchId_userId: { matchId, userId: req.userId } },
      update: { confirmed: true },
      create: { matchId, userId: req.userId, confirmed: true },
    });

    // Notify other players
    const submitter = match.players.find((p) => p.userId === req.userId);
    const otherPlayers = match.players.filter((p) => p.userId !== req.userId);
    const { text, reply_markup } = await notifyScoreConfirmation(
      submitter.user,
      match,
      sets.map((s, i) => ({ ...s, setNumber: i + 1 }))
    );

    for (const p of otherPlayers) {
      await sendTelegramMessage(p.user.telegramId.toString(), text, { reply_markup });
    }

    // Calculate preview
    const team1 = match.players.filter((p) => p.team === 1).map((p) => p.user);
    const team2 = match.players.filter((p) => p.team === 2).map((p) => p.user);
    const tournament = match.tournamentId
      ? await prisma.tournament.findUnique({ where: { id: match.tournamentId } })
      : null;

    const { changes, winningTeam } = calculateRatingChanges(
      team1,
      team2,
      sets.map((s, i) => ({ team1Score: parseInt(s.team1Score), team2Score: parseInt(s.team2Score), setNumber: i + 1 })),
      tournament?.ratingMultiplier || 1.0
    );

    res.json({
      matchId,
      status: "PENDING_CONFIRMATION",
      winningTeam,
      ratingPreview: changes,
    });
  } catch (err) {
    console.error("Score error:", err);
    res.status(500).json({ error: "Ошибка записи счёта" });
  }
});

// Confirm score
router.post("/:id/confirm", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: { include: { user: true } },
        sets: { orderBy: { setNumber: "asc" } },
        confirmations: true,
      },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.status !== "PENDING_CONFIRMATION") {
      return res.status(400).json({ error: "Матч не ожидает подтверждения" });
    }

    // Upsert confirmation
    await prisma.scoreConfirmation.upsert({
      where: { matchId_userId: { matchId, userId: req.userId } },
      update: { confirmed: true },
      create: { matchId, userId: req.userId, confirmed: true },
    });

    // Check if all players confirmed (at least losing team)
    const allConfirms = await prisma.scoreConfirmation.findMany({ where: { matchId } });
    const confirmedCount = allConfirms.filter((c) => c.confirmed).length;

    // Need at least 3 confirmations (or all players)
    if (confirmedCount >= 3) {
      // Apply rating changes
      const team1 = match.players.filter((p) => p.team === 1).map((p) => p.user);
      const team2 = match.players.filter((p) => p.team === 2).map((p) => p.user);
      const tournament = match.tournamentId
        ? await prisma.tournament.findUnique({ where: { id: match.tournamentId } })
        : null;

      const { changes, winningTeam } = calculateRatingChanges(
        team1,
        team2,
        match.sets,
        tournament?.ratingMultiplier || 1.0
      );

      // Apply changes to each player
      for (const change of changes) {
        const player = match.players.find((p) => p.userId === change.userId);
        const user = player.user;

        const newWinStreak = change.won ? user.winStreak + 1 : 0;
        const newMaxWinStreak = Math.max(user.maxWinStreak, newWinStreak);

        await prisma.user.update({
          where: { id: change.userId },
          data: {
            rating: change.newRating,
            matchesPlayed: { increment: 1 },
            wins: change.won ? { increment: 1 } : undefined,
            losses: !change.won ? { increment: 1 } : undefined,
            winStreak: newWinStreak,
            maxWinStreak: newMaxWinStreak,
          },
        });

        await prisma.ratingHistory.create({
          data: {
            userId: change.userId,
            oldRating: change.oldRating,
            newRating: change.newRating,
            change: change.change,
            reason: change.won ? "match_win" : "match_loss",
            matchId,
          },
        });

        // Notify about rating change
        await notifyRatingChange(
          user.telegramId.toString(),
          change.oldRating,
          change.newRating,
          change.change
        );

        // Check achievements
        const newAchievements = await checkAndAwardAchievements(change.userId);
        for (const a of newAchievements) {
          await notifyNewAchievement(user.telegramId.toString(), a);
        }

        // Check event-based achievements
        // Comeback: won after losing first set
        if (change.won && match.sets.length >= 2) {
          const firstSet = match.sets[0];
          const lostFirstSet =
            (player.team === 1 && firstSet.team1Score < firstSet.team2Score) ||
            (player.team === 2 && firstSet.team2Score < firstSet.team1Score);
          if (lostFirstSet) {
            const a = await checkEventAchievement(change.userId, "comeback");
            if (a) await notifyNewAchievement(user.telegramId.toString(), a);
          }
        }

        // Clean sheet
        const hasCleanSheet = match.sets.some(
          (s) =>
            (player.team === 1 && s.team1Score === 6 && s.team2Score === 0) ||
            (player.team === 2 && s.team2Score === 6 && s.team1Score === 0)
        );
        if (hasCleanSheet) {
          const a = await checkEventAchievement(change.userId, "clean_sheet");
          if (a) await notifyNewAchievement(user.telegramId.toString(), a);
        }

        // Giant slayer
        if (change.won) {
          const myTeamAvg = player.team === 1
            ? (team1[0].rating + team1[1].rating) / 2
            : (team2[0].rating + team2[1].rating) / 2;
          const oppTeamAvg = player.team === 1
            ? (team2[0].rating + team2[1].rating) / 2
            : (team1[0].rating + team1[1].rating) / 2;
          if (oppTeamAvg - myTeamAvg >= 200) {
            const a = await checkEventAchievement(change.userId, "giant_slayer");
            if (a) await notifyNewAchievement(user.telegramId.toString(), a);
          }
        }
      }

      // Mark match as completed
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED" },
      });

      res.json({ status: "COMPLETED", changes });
    } else {
      res.json({ status: "PENDING_CONFIRMATION", confirmedCount, needed: 3 });
    }
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ error: "Ошибка подтверждения счёта" });
  }
});

// Public match info (for bot deep links, no auth)
router.get("/:id/info", async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: true,
        players: {
          where: { status: "APPROVED" },
          include: { user: { select: { firstName: true, rating: true } } },
        },
      },
    });
    if (!match) return res.status(404).json({ error: "Матч не найден" });
    res.json(match);
  } catch (err) {
    console.error("Match info error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

module.exports = router;
