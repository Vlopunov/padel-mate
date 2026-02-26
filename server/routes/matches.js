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
    const { venueId, date, durationMin, levelMin, levelMax, courtBooked, courtNumber, matchType, notes } = req.body;

    if (!venueId || !date || !durationMin) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    // Prevent creating matches in the past
    if (new Date(date) <= new Date()) {
      return res.status(400).json({ error: "Нельзя создать матч задним числом" });
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
        courtNumber: courtNumber ? parseInt(courtNumber) : null,
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

// Create past match (already played) — skips RECRUITING, goes straight to FULL
router.post("/past", authMiddleware, async (req, res) => {
  try {
    const { venueId, date, durationMin, playerIds, matchType, notes } = req.body;

    if (!venueId || !date || !durationMin) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length !== 3) {
      return res.status(400).json({ error: "Укажите 3 других игроков" });
    }

    // All 4 players: creator + 3 selected
    const allPlayerIds = [req.userId, ...playerIds.map((id) => parseInt(id))];
    const uniqueIds = new Set(allPlayerIds);
    if (uniqueIds.size !== 4) {
      return res.status(400).json({ error: "Все 4 игрока должны быть разными" });
    }

    // Verify all players exist
    const players = await prisma.user.findMany({
      where: { id: { in: allPlayerIds } },
      select: { id: true, firstName: true },
    });
    if (players.length !== 4) {
      return res.status(400).json({ error: "Один или несколько игроков не найдены" });
    }

    // Create match in FULL status with all 4 players approved
    const match = await prisma.match.create({
      data: {
        creatorId: req.userId,
        venueId: parseInt(venueId),
        date: new Date(date),
        durationMin: parseInt(durationMin),
        levelMin: 1.0,
        levelMax: 4.0,
        courtBooked: false,
        matchType: matchType || "RATED",
        notes: notes || null,
        status: "FULL",
        players: {
          create: allPlayerIds.map((id, idx) => ({
            userId: id,
            team: idx < 2 ? 1 : 2, // temporary, will be reassigned during score entry
            status: "APPROVED",
          })),
        },
      },
      include: {
        venue: true,
        players: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true },
            },
          },
        },
      },
    });

    // Notify other players about the recorded match (fetch telegramIds separately to avoid BigInt serialization)
    try {
      const dateStr = new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      const creator = players.find((p) => p.id === req.userId);
      const otherPlayerIds = allPlayerIds.filter((id) => id !== req.userId);
      const otherUsers = await prisma.user.findMany({
        where: { id: { in: otherPlayerIds } },
        select: { id: true, telegramId: true },
      });
      for (const u of otherUsers) {
        if (u.telegramId) {
          try {
            const text =
              `📝 <b>${creator.firstName}</b> записал сыгранный матч.\n` +
              `📅 ${dateStr}\n` +
              `📍 ${match.venue?.name || "—"}\n\n` +
              `Ожидайте записи счёта и подтвердите результат.`;
            await sendTelegramMessage(u.telegramId.toString(), text);
          } catch (notifErr) {
            console.error("Past match notification error:", notifErr);
          }
        }
      }
    } catch (notifErr) {
      console.error("Past match notifications error:", notifErr);
    }

    res.json(match);
  } catch (err) {
    console.error("Create past match error:", err);
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

// Bot-internal score confirmation (by telegram ID, authenticated by X-Bot-Token)
router.post("/:id/bot-confirm/:telegramId", async (req, res) => {
  try {
    const botToken = req.headers["x-bot-token"];
    if (!botToken || botToken !== process.env.BOT_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matchId = parseInt(req.params.id);
    const telegramId = BigInt(req.params.telegramId);

    // Find user by telegramId
    const botUser = await prisma.user.findUnique({ where: { telegramId } });
    if (!botUser) return res.status(404).json({ error: "Пользователь не найден" });

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

    // Check 7-day expiry
    if (match.scoreSubmittedAt) {
      const daysSince = (Date.now() - new Date(match.scoreSubmittedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        await prisma.matchSet.deleteMany({ where: { matchId } });
        await prisma.scoreConfirmation.deleteMany({ where: { matchId } });
        await prisma.match.update({
          where: { id: matchId },
          data: { status: "FULL", scoreSubmittedAt: null, scoreSubmitterId: null },
        });
        return res.status(400).json({ error: "Срок подтверждения истёк (7 дней). Счёт аннулирован." });
      }
    }

    // Check this user is an opponent
    const allApproved = match.players.filter((p) => p.status === "APPROVED");
    const submitterPlayer = allApproved.find((p) => p.userId === match.scoreSubmitterId);
    const confirmingPlayer = allApproved.find((p) => p.userId === botUser.id);

    if (!confirmingPlayer) {
      return res.status(403).json({ error: "Вы не участник этого матча" });
    }
    if (submitterPlayer && confirmingPlayer.team === submitterPlayer.team) {
      return res.status(400).json({ error: "Подтвердить должен соперник (игрок другой команды)" });
    }

    // Upsert confirmation
    await prisma.scoreConfirmation.upsert({
      where: { matchId_userId: { matchId, userId: botUser.id } },
      update: { confirmed: true },
      create: { matchId, userId: botUser.id, confirmed: true },
    });

    // Apply ratings
    const team1 = allApproved.filter((p) => p.team === 1).map((p) => p.user);
    const team2 = allApproved.filter((p) => p.team === 2).map((p) => p.user);
    const tournament = match.tournamentId
      ? await prisma.tournament.findUnique({ where: { id: match.tournamentId } })
      : null;

    const { changes, winningTeam } = calculateRatingChanges(
      team1, team2, match.sets, tournament?.ratingMultiplier || 1.0
    );

    for (const change of changes) {
      const player = allApproved.find((p) => p.userId === change.userId);
      const u = player.user;
      const newWinStreak = change.won ? u.winStreak + 1 : 0;
      const newMaxWinStreak = Math.max(u.maxWinStreak, newWinStreak);

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

      await notifyRatingChange(u.telegramId.toString(), change.oldRating, change.newRating, change.change);

      const newAchievements = await checkAndAwardAchievements(change.userId);
      for (const a of newAchievements) {
        await notifyNewAchievement(u.telegramId.toString(), a);
      }
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { status: "COMPLETED" },
    });

    res.json({ status: "COMPLETED", changes });
  } catch (err) {
    console.error("Bot confirm score error:", err);
    res.status(500).json({ error: "Ошибка подтверждения" });
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

    const { venueId, date, durationMin, levelMin, levelMax, courtBooked, courtNumber, matchType, notes } = req.body;
    const data = {};
    if (venueId !== undefined) data.venueId = parseInt(venueId);
    if (date !== undefined) data.date = new Date(date);
    if (durationMin !== undefined) data.durationMin = parseInt(durationMin);
    if (levelMin !== undefined) data.levelMin = parseFloat(levelMin);
    if (levelMax !== undefined) data.levelMax = parseFloat(levelMax);
    if (courtBooked !== undefined) data.courtBooked = courtBooked;
    if (courtNumber !== undefined) data.courtNumber = courtNumber ? parseInt(courtNumber) : null;
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
    const { sets, teams } = req.body;

    if (!sets || !Array.isArray(sets) || sets.length < 1 || sets.length > 10) {
      return res.status(400).json({ error: "Укажите от 1 до 10 сетов" });
    }

    if (!teams || !Array.isArray(teams) || teams.length !== 4) {
      return res.status(400).json({ error: "Укажите распределение по командам (4 игрока)" });
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

    const isPlayer = approvedInMatch.some((p) => p.userId === req.userId);
    if (!isPlayer) {
      return res.status(403).json({ error: "Вы не участник этого матча" });
    }

    // Update team assignments from frontend
    for (const t of teams) {
      await prisma.matchPlayer.updateMany({
        where: { matchId, userId: t.userId },
        data: { team: t.team },
      });
    }

    // Delete existing sets & confirmations if re-submitting
    await prisma.matchSet.deleteMany({ where: { matchId } });
    await prisma.scoreConfirmation.deleteMany({ where: { matchId } });

    // Create sets (with optional tiebreak scores)
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      const t1 = parseInt(s.team1Score);
      const t2 = parseInt(s.team2Score);
      const isTiebreak = (t1 === 7 && t2 === 6) || (t1 === 6 && t2 === 7);
      await prisma.matchSet.create({
        data: {
          matchId,
          setNumber: i + 1,
          team1Score: t1,
          team2Score: t2,
          team1Tiebreak: isTiebreak && s.team1Tiebreak != null ? parseInt(s.team1Tiebreak) : null,
          team2Tiebreak: isTiebreak && s.team2Tiebreak != null ? parseInt(s.team2Tiebreak) : null,
        },
      });
    }

    // Find submitter's team
    const submitterTeam = teams.find((t) => t.userId === req.userId)?.team;

    // Update match status + who submitted and when
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "PENDING_CONFIRMATION",
        scoreSubmittedAt: new Date(),
        scoreSubmitterId: req.userId,
      },
    });

    // Create score confirmation for submitter (auto-confirmed)
    await prisma.scoreConfirmation.create({
      data: { matchId, userId: req.userId, confirmed: true },
    });

    // Notify only opponents (other team) for confirmation
    const submitterUser = approvedInMatch.find((p) => p.userId === req.userId)?.user;
    const opponents = teams
      .filter((t) => t.team !== submitterTeam)
      .map((t) => approvedInMatch.find((p) => p.userId === t.userId))
      .filter(Boolean);

    const { text, reply_markup } = await notifyScoreConfirmation(
      submitterUser,
      match,
      sets.map((s, i) => ({ ...s, setNumber: i + 1 }))
    );

    for (const p of opponents) {
      await sendTelegramMessage(p.user.telegramId.toString(), text, { reply_markup });
    }

    // Calculate preview using updated teams
    const team1Users = teams.filter((t) => t.team === 1).map((t) => approvedInMatch.find((p) => p.userId === t.userId)?.user);
    const team2Users = teams.filter((t) => t.team === 2).map((t) => approvedInMatch.find((p) => p.userId === t.userId)?.user);
    const tournament = match.tournamentId
      ? await prisma.tournament.findUnique({ where: { id: match.tournamentId } })
      : null;

    const { changes, winningTeam } = calculateRatingChanges(
      team1Users,
      team2Users,
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

// Confirm score — only 1 opponent from the other team needs to confirm, 7-day expiry
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

    // Check 7-day expiry
    if (match.scoreSubmittedAt) {
      const daysSince = (Date.now() - new Date(match.scoreSubmittedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) {
        // Expired — revert to FULL, clear score data
        await prisma.matchSet.deleteMany({ where: { matchId } });
        await prisma.scoreConfirmation.deleteMany({ where: { matchId } });
        await prisma.match.update({
          where: { id: matchId },
          data: { status: "FULL", scoreSubmittedAt: null, scoreSubmitterId: null },
        });
        return res.status(400).json({ error: "Срок подтверждения истёк (7 дней). Счёт аннулирован." });
      }
    }

    // Check that confirming user is from the OPPOSING team of the score submitter
    const approvedPlayers = match.players.filter((p) => p.status === "APPROVED");
    const submitterPlayer = approvedPlayers.find((p) => p.userId === match.scoreSubmitterId);
    const confirmingPlayer = approvedPlayers.find((p) => p.userId === req.userId);

    if (!confirmingPlayer) {
      return res.status(403).json({ error: "Вы не участник этого матча" });
    }

    if (submitterPlayer && confirmingPlayer.team === submitterPlayer.team) {
      return res.status(400).json({ error: "Подтвердить должен соперник (игрок другой команды)" });
    }

    // Upsert confirmation
    await prisma.scoreConfirmation.upsert({
      where: { matchId_userId: { matchId, userId: req.userId } },
      update: { confirmed: true },
      create: { matchId, userId: req.userId, confirmed: true },
    });

    // Only 1 opponent confirmation needed — apply ratings immediately
    const team1 = approvedPlayers.filter((p) => p.team === 1).map((p) => p.user);
    const team2 = approvedPlayers.filter((p) => p.team === 2).map((p) => p.user);
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
      const player = approvedPlayers.find((p) => p.userId === change.userId);
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
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ error: "Ошибка подтверждения счёта" });
  }
});

// ─── Comments ───

// Get comments for a match
router.get("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const comments = await prisma.matchComment.findMany({
      where: { matchId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: "Ошибка получения комментариев" });
  }
});

// Add comment
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { text } = req.body;

    if (!text || !text.trim()) return res.status(400).json({ error: "Напишите комментарий" });

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Матч не найден" });

    const comment = await prisma.matchComment.create({
      data: { matchId, userId: req.userId, text: text.trim() },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true },
        },
      },
    });

    res.json(comment);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Ошибка добавления комментария" });
  }
});

// ─── Invite player (creator sends invitation, player must accept) ───

router.post("/:id/add-player/:userId", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true, venue: true },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });
    if (match.creatorId !== req.userId) return res.status(403).json({ error: "Только создатель может приглашать игроков" });
    if (match.status !== "RECRUITING") return res.status(400).json({ error: "Набор закрыт" });

    // Check if player already in match (any status)
    if (match.players.some((p) => p.userId === targetUserId)) {
      return res.status(400).json({ error: "Игрок уже в матче или приглашён" });
    }

    const approved = approvedPlayers(match.players);
    if (approved.length >= 4) return res.status(400).json({ error: "Матч уже полный" });

    // Balance teams
    const team1Count = approved.filter((p) => p.team === 1).length;
    const team2Count = approved.filter((p) => p.team === 2).length;
    const team = team1Count <= team2Count ? 1 : 2;

    // Create with INVITED status — player must accept
    await prisma.matchPlayer.create({
      data: { matchId, userId: targetUserId, team, status: "INVITED" },
    });

    // Notify the invited player via Telegram
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    const creator = await prisma.user.findUnique({ where: { id: req.userId } });
    if (targetUser && targetUser.telegramId) {
      const creatorName = creator.firstName + (creator.lastName ? ` ${creator.lastName}` : '');
      const venueName = match.venue?.name || '';
      const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      const timeStr = new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const text = `🎾 <b>Вас пригласили в матч!</b>\n👤 От: ${creatorName}\n📍 ${venueName}\n📅 ${dateStr} в ${timeStr}\n\nОткройте приложение чтобы принять или отклонить.`;
      await sendTelegramMessage(targetUser.telegramId.toString(), text);
    }

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true } } } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Invite player error:", err);
    res.status(500).json({ error: "Ошибка приглашения игрока" });
  }
});

// Accept invitation (invited player accepts)
router.post("/:id/accept-invite", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true, venue: true },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });

    const player = match.players.find((p) => p.userId === req.userId && p.status === "INVITED");
    if (!player) return res.status(400).json({ error: "Приглашение не найдено" });

    const approved = approvedPlayers(match.players);
    if (approved.length >= 4) {
      // Match already full — remove the invitation
      await prisma.matchPlayer.delete({ where: { id: player.id } });
      return res.status(400).json({ error: "Матч уже полный" });
    }

    await prisma.matchPlayer.update({
      where: { id: player.id },
      data: { status: "APPROVED" },
    });

    // Check if match is now full
    if (approved.length + 1 >= 4) {
      await prisma.match.update({ where: { id: matchId }, data: { status: "FULL" } });
    }

    // Notify creator
    const creator = await prisma.user.findUnique({ where: { id: match.creatorId } });
    const acceptedUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (creator && creator.telegramId && creator.id !== req.userId) {
      const userName = acceptedUser.firstName + (acceptedUser.lastName ? ` ${acceptedUser.lastName}` : '');
      const text = `✅ <b>${userName}</b> принял(а) приглашение в матч!`;
      await sendTelegramMessage(creator.telegramId.toString(), text);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ error: "Ошибка принятия приглашения" });
  }
});

// Decline invitation (invited player declines)
router.post("/:id/decline-invite", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });

    const player = match.players.find((p) => p.userId === req.userId && p.status === "INVITED");
    if (!player) return res.status(400).json({ error: "Приглашение не найдено" });

    await prisma.matchPlayer.delete({ where: { id: player.id } });

    // Notify creator
    const creator = await prisma.user.findUnique({ where: { id: match.creatorId } });
    const declinedUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (creator && creator.telegramId && creator.id !== req.userId) {
      const userName = declinedUser.firstName + (declinedUser.lastName ? ` ${declinedUser.lastName}` : '');
      const text = `❌ <b>${userName}</b> отклонил(а) приглашение в матч.`;
      await sendTelegramMessage(creator.telegramId.toString(), text);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Decline invite error:", err);
    res.status(500).json({ error: "Ошибка отклонения приглашения" });
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
