const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { calculateRatingChanges, calculatePairRatingChanges, normalizePairIds, determineWinner, getLevel } = require("../services/rating");
const { checkAndAwardAchievements, checkEventAchievement } = require("../services/achievements");
const { notifyRatingChange, notifyNewAchievement, sendTelegramMessage, notifyScoreConfirmation, notifyMatchFull, notifyLeaderboardPosition } = require("../services/notifications");

const router = express.Router();

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

    // Validate matchType
    if (matchType && !["RATED", "FRIENDLY"].includes(matchType)) {
      return res.status(400).json({ error: "Недопустимый тип матча" });
    }

    // Validate notes length
    if (notes && notes.length > 5000) {
      return res.status(400).json({ error: "Заметка слишком длинная (макс. 5000 символов)" });
    }

    const match = await prisma.match.create({
      data: {
        creatorId: req.userId,
        venueId: parseInt(venueId),
        date: new Date(date),
        durationMin: parseInt(durationMin),
        levelMin: isNaN(parseFloat(levelMin)) ? 1.0 : parseFloat(levelMin),
        levelMax: isNaN(parseFloat(levelMax)) ? 4.0 : parseFloat(levelMax),
        courtBooked: courtBooked || false,
        courtNumber: courtNumber ? parseInt(courtNumber) : null,
        matchType: matchType || "RATED",
        notes: notes || null,
        players: {
          create: { userId: req.userId, team: null },
        },
      },
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true } } } },
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

    // Past match date must be in the past
    if (new Date(date) > new Date()) {
      return res.status(400).json({ error: "Дата сыгранного матча не может быть в будущем" });
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
            team: null, // will be assigned during score entry
            status: "APPROVED",
          })),
        },
      },
      include: {
        venue: true,
        players: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true },
            },
          },
        },
      },
    });

    // Notify other players about the recorded match (fetch telegramIds separately to avoid BigInt serialization)
    try {
      const dateStr = new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Minsk" });
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
    const { status, regionId, level } = req.query;
    const where = {};

    if (status === "recruiting") where.status = "RECRUITING";
    else if (status === "full") where.status = { in: ["FULL", "PENDING_SCORE"] };
    else where.status = { not: "CANCELLED" };

    if (regionId) where.venue = { regionId: parseInt(regionId) };
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
              select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true },
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
              select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true },
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
  // Use transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { players: true, venue: true },
    });
    if (!match) return { error: "Матч не найден", status: 404 };

    const player = match.players.find((p) => p.userId === userId);
    if (!player) return { error: "Заявка не найдена", status: 404 };
    if (player.status === "APPROVED") return { error: "Уже одобрен", status: 400 };

    await tx.matchPlayer.update({
      where: { id: player.id },
      data: { status: "APPROVED" },
    });

    // Re-count approved players inside transaction
    const freshMatch = await tx.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });
    const approvedCount = approvedPlayers(freshMatch.players).length;
    let becameFull = false;
    if (approvedCount >= 4 && match.status !== "FULL") {
      await tx.match.update({ where: { id: matchId }, data: { status: "FULL" } });
      becameFull = true;
    }

    return { success: true, becameFull, venue: match.venue, date: match.date };
  });

  if (result.error) return result;

  // Notifications outside transaction (non-critical)
  if (result.becameFull) {
    try {
      const fullMatch = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: { where: { status: "APPROVED" }, include: { user: true } }, venue: true },
      });
      const playerNames = fullMatch.players.map((p) => p.user.firstName);
      for (const p of fullMatch.players) {
        notifyMatchFull(p.user.telegramId.toString(), fullMatch, playerNames).catch((e) => console.error("[Notify] error:", e.message));
      }
    } catch (e) { console.error("[MatchFull] notify error:", e.message); }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.telegramId) {
    const venueName = result.venue?.name || '';
    const dateStr = new Date(result.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Minsk' });
    const timeStr = new Date(result.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Minsk' });
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
    const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Minsk' });
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

    // Use unique constraint to prevent duplicate joins
    try {
      await prisma.matchPlayer.create({
        data: { matchId, userId: req.userId, team: null, status: "PENDING" },
      });
    } catch (e) {
      if (e.code === "P2002") return res.status(400).json({ error: "Вы уже подали заявку" });
      throw e;
    }

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true } } } },
      },
    });

    // Notify match creator with approve/reject buttons
    const joiner = await prisma.user.findUnique({ where: { id: req.userId } });
    const creator = await prisma.user.findUnique({ where: { id: match.creatorId } });
    if (creator && creator.telegramId && creator.id !== req.userId) {
      const joinerName = joiner.firstName + (joiner.lastName ? ` ${joiner.lastName}` : '');
      const venueName = match.venue?.name || '';
      const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Minsk' });
      const timeStr = new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Minsk' });
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
    if (submitterPlayer && confirmingPlayer.team != null && submitterPlayer.team != null && confirmingPlayer.team === submitterPlayer.team) {
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
    if (team1.length !== 2 || team2.length !== 2) {
      return res.status(400).json({ error: "Команды не распределены корректно" });
    }
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

      // Event-based achievements (same as regular confirm)
      // Comeback: won after losing first set
      if (change.won && match.sets.length >= 2) {
        const firstSet = match.sets[0];
        const lostFirstSet =
          (player.team === 1 && firstSet.team1Score < firstSet.team2Score) ||
          (player.team === 2 && firstSet.team2Score < firstSet.team1Score);
        if (lostFirstSet) {
          const a = await checkEventAchievement(change.userId, "comeback");
          if (a) await notifyNewAchievement(u.telegramId.toString(), a);
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
        if (a) await notifyNewAchievement(u.telegramId.toString(), a);
      }

      // Giant slayer
      if (change.won && team1.length === 2 && team2.length === 2) {
        const myTeamAvg = player.team === 1
          ? (team1[0].rating + team1[1].rating) / 2
          : (team2[0].rating + team2[1].rating) / 2;
        const oppTeamAvg = player.team === 1
          ? (team2[0].rating + team2[1].rating) / 2
          : (team1[0].rating + team1[1].rating) / 2;
        if (oppTeamAvg - myTeamAvg >= 200) {
          const a = await checkEventAchievement(change.userId, "giant_slayer");
          if (a) await notifyNewAchievement(u.telegramId.toString(), a);
        }
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

    await prisma.matchComment.deleteMany({ where: { matchId } });
    await prisma.scoreConfirmation.deleteMany({ where: { matchId } });
    await prisma.matchSet.deleteMany({ where: { matchId } });
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
    if (levelMin !== undefined && !isNaN(parseFloat(levelMin))) data.levelMin = parseFloat(levelMin);
    if (levelMax !== undefined && !isNaN(parseFloat(levelMax))) data.levelMax = parseFloat(levelMax);
    if (courtBooked !== undefined) data.courtBooked = courtBooked;
    if (courtNumber !== undefined) data.courtNumber = courtNumber ? parseInt(courtNumber) : null;
    if (matchType !== undefined) data.matchType = matchType;
    if (notes !== undefined) data.notes = notes || null;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true } } } },
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
      await prisma.matchComment.deleteMany({ where: { matchId } });
      await prisma.scoreConfirmation.deleteMany({ where: { matchId } });
      await prisma.matchSet.deleteMany({ where: { matchId } });
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

    if (!sets || !Array.isArray(sets) || sets.length < 1 || sets.length > 3) {
      return res.status(400).json({ error: "Укажите от 1 до 3 сетов" });
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

    // Validate team assignments: must have exactly 2 players per team, values only 1 or 2
    if (!teams.every((t) => t.team === 1 || t.team === 2)) {
      return res.status(400).json({ error: "Команда может быть только 1 или 2" });
    }
    const team1Count = teams.filter((t) => t.team === 1).length;
    const team2Count = teams.filter((t) => t.team === 2).length;
    if (team1Count !== 2 || team2Count !== 2) {
      return res.status(400).json({ error: "В каждой команде должно быть по 2 игрока" });
    }

    // Validate set scores (padel rules)
    for (const s of sets) {
      const t1 = parseInt(s.team1Score);
      const t2 = parseInt(s.team2Score);
      if (isNaN(t1) || isNaN(t2) || t1 < 0 || t2 < 0 || t1 > 7 || t2 > 7) {
        return res.status(400).json({ error: "Некорректный счёт сета (0-7)" });
      }
      // Must have a winner: one side >= 6
      if (t1 < 6 && t2 < 6) {
        return res.status(400).json({ error: "Сет не завершён — минимум 6 геймов для победы" });
      }
      // 7 only valid as 7-5 or 7-6
      if (t1 === 7 && t2 < 5) return res.status(400).json({ error: "Некорректный счёт: 7 возможно только при 7-5 или 7-6" });
      if (t2 === 7 && t1 < 5) return res.status(400).json({ error: "Некорректный счёт: 7 возможно только при 7-5 или 7-6" });
      // Can't tie at 6-6 without going to 7
      if (t1 === 6 && t2 === 6) return res.status(400).json({ error: "При 6-6 должен быть тай-брейк (7-6)" });
    }

    // Must have an overall match winner (no tied sets count)
    const parsedSets = sets.map((s) => ({ team1Score: parseInt(s.team1Score), team2Score: parseInt(s.team2Score) }));
    if (determineWinner(parsedSets) === null) {
      return res.status(400).json({ error: "Должен быть победитель матча" });
    }

    // All score operations in a single transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      // Update team assignments
      for (const t of teams) {
        await tx.matchPlayer.updateMany({
          where: { matchId, userId: t.userId },
          data: { team: t.team },
        });
      }

      // Delete existing sets & confirmations if re-submitting
      await tx.matchSet.deleteMany({ where: { matchId } });
      await tx.scoreConfirmation.deleteMany({ where: { matchId } });

      // Create sets
      for (let i = 0; i < sets.length; i++) {
        const s = sets[i];
        const t1 = parseInt(s.team1Score);
        const t2 = parseInt(s.team2Score);
        const isTiebreak = (t1 === 7 && t2 === 6) || (t1 === 6 && t2 === 7);
        await tx.matchSet.create({
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

      // Update match status + who submitted and when
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: "PENDING_CONFIRMATION",
          scoreSubmittedAt: new Date(),
          scoreSubmitterId: req.userId,
        },
      });

      // Create score confirmation for submitter (auto-confirmed)
      await tx.scoreConfirmation.create({
        data: { matchId, userId: req.userId, confirmed: true },
      });
    });

    // Find submitter's team (for notifications, outside transaction)
    const submitterTeam = teams.find((t) => t.userId === req.userId)?.team;

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
    const team1Users = teams.filter((t) => t.team === 1).map((t) => approvedInMatch.find((p) => p.userId === t.userId)?.user).filter(Boolean);
    const team2Users = teams.filter((t) => t.team === 2).map((t) => approvedInMatch.find((p) => p.userId === t.userId)?.user).filter(Boolean);
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

    if (submitterPlayer && confirmingPlayer.team != null && submitterPlayer.team != null && confirmingPlayer.team === submitterPlayer.team) {
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
    if (team1.length !== 2 || team2.length !== 2) {
      return res.status(400).json({ error: "Команды не распределены корректно" });
    }
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

      // Notify leaderboard position (top-10 or improved)
      try {
        const higherCount = await prisma.user.count({ where: { rating: { gt: change.newRating } } });
        const position = higherCount + 1;
        const prevHigherCount = await prisma.user.count({ where: { rating: { gt: change.oldRating } } });
        const prevPosition = prevHigherCount + 1;
        if (position <= 10 || position < prevPosition) {
          await notifyLeaderboardPosition(user.telegramId.toString(), position, prevPosition, change.newRating);
        }
      } catch (e) { console.error("[Leaderboard] notify error:", e.message); }

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
      if (change.won && team1.length === 2 && team2.length === 2) {
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

    // --- Pair Elo Rating ---
    try {
      const [t1p1, t1p2] = normalizePairIds(team1[0].id, team1[1].id);
      const [t2p1, t2p2] = normalizePairIds(team2[0].id, team2[1].id);

      // Upsert pair 1 (team 1)
      let pair1 = await prisma.pair.findUnique({
        where: { player1Id_player2Id: { player1Id: t1p1, player2Id: t1p2 } },
      });
      if (!pair1) {
        const avgRating = Math.round((team1[0].rating + team1[1].rating) / 2);
        pair1 = await prisma.pair.create({
          data: { player1Id: t1p1, player2Id: t1p2, rating: avgRating },
        });
      }

      // Upsert pair 2 (team 2)
      let pair2 = await prisma.pair.findUnique({
        where: { player1Id_player2Id: { player1Id: t2p1, player2Id: t2p2 } },
      });
      if (!pair2) {
        const avgRating = Math.round((team2[0].rating + team2[1].rating) / 2);
        pair2 = await prisma.pair.create({
          data: { player1Id: t2p1, player2Id: t2p2, rating: avgRating },
        });
      }

      const pairChanges = calculatePairRatingChanges(
        { id: pair1.id, rating: pair1.rating, matchesPlayed: pair1.matchesPlayed },
        { id: pair2.id, rating: pair2.rating, matchesPlayed: pair2.matchesPlayed },
        match.sets,
        tournament?.ratingMultiplier || 1.0
      );

      for (const pc of [pairChanges.pair1Change, pairChanges.pair2Change]) {
        const currentPair = await prisma.pair.findUnique({ where: { id: pc.pairId } });
        const newWinStreak = pc.won ? currentPair.winStreak + 1 : 0;
        const newMaxWinStreak = Math.max(currentPair.maxWinStreak, newWinStreak);

        await prisma.pair.update({
          where: { id: pc.pairId },
          data: {
            rating: pc.newRating,
            matchesPlayed: { increment: 1 },
            wins: pc.won ? { increment: 1 } : undefined,
            losses: !pc.won ? { increment: 1 } : undefined,
            winStreak: newWinStreak,
            maxWinStreak: newMaxWinStreak,
          },
        });

        await prisma.pairRatingHistory.create({
          data: {
            pairId: pc.pairId,
            oldRating: pc.oldRating,
            newRating: pc.newRating,
            change: pc.change,
            reason: pc.won ? "match_win" : "match_loss",
            matchId,
          },
        });
      }
    } catch (pairErr) {
      console.error("Pair rating error (non-fatal):", pairErr);
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
          select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true, isVip: true },
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
    if (text.length > 2000) return res.status(400).json({ error: "Комментарий слишком длинный (макс. 2000 символов)" });

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: "Матч не найден" });

    const comment = await prisma.matchComment.create({
      data: { matchId, userId: req.userId, text: text.trim() },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true, isVip: true },
        },
      },
    });

    res.json(comment);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Ошибка добавления комментария" });
  }
});

// ─── Calendar .ics download (supports token via query for external browser) ───

router.get("/:id/calendar", async (req, res) => {
  try {
    // Auth: header OR query param (for external browser opening)
    const jwt = require("jsonwebtoken");
    const { SECRET } = require("../middleware/auth");
    let userId;

    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : queryToken;

    if (!token) return res.status(401).json({ error: "Требуется авторизация" });
    try {
      const decoded = jwt.verify(token, SECRET);
      userId = decoded.id;
    } catch {
      return res.status(401).json({ error: "Недействительный токен" });
    }

    const matchId = parseInt(req.params.id);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: true,
        players: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, rating: true, isVip: true } },
          },
        },
      },
    });

    if (!match) return res.status(404).json({ error: "Матч не найден" });

    const myPlayer = match.players.find((p) => p.userId === userId && p.status === "APPROVED");
    if (!myPlayer) {
      return res.status(403).json({ error: "Только участники могут скачать календарь" });
    }

    // Generate .ics manually for proper UTF-8 support
    const matchDate = new Date(match.date);
    const endDate = new Date(matchDate.getTime() + match.durationMin * 60000);

    const pad = (n) => String(n).padStart(2, "0");
    const fmtDate = (d) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const icsEscape = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

    const approvedNames = match.players
      .filter((p) => p.status === "APPROVED")
      .map((p) => `${p.user.firstName}${p.user.lastName ? " " + p.user.lastName : ""} (${p.user.rating})`)
      .join("\\n");

    const matchTypeLabel = match.matchType === "RATED" ? "Рейтинговый" : "Дружеский";
    const level = getLevel(match.levelMin || 1500);

    const summary = icsEscape(`Падел — ${match.venue?.name || "Матч"}`);
    const location = match.venue ? icsEscape(`${match.venue.name}, ${match.venue.address}`) : "";
    const description = icsEscape(
      `Тип: ${matchTypeLabel}\nУровень: ${level.category} — ${level.name}\n\nИгроки:\n${approvedNames}\n\nPadel GO — t.me/PadelGoBY_bot`
    );

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Padel GO//Match//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:padel-go-match-${match.id}@padelgo.by`,
      `DTSTART:${fmtDate(matchDate)}`,
      `DTEND:${fmtDate(endDate)}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Матч через 2 часа!",
      "TRIGGER:-PT2H",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const buf = Buffer.from(ics, "utf-8");
    res.set({
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="padel-match-${match.id}.ics"`,
      "Content-Length": buf.length,
    });
    res.send(buf);
  } catch (err) {
    console.error("Calendar generation error:", err);
    res.status(500).json({ error: "Ошибка генерации календаря" });
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

    // Create with INVITED status — player must accept
    await prisma.matchPlayer.create({
      data: { matchId, userId: targetUserId, team: null, status: "INVITED" },
    });

    // Notify the invited player via Telegram
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    const creator = await prisma.user.findUnique({ where: { id: req.userId } });
    if (targetUser && targetUser.telegramId) {
      const creatorName = creator.firstName + (creator.lastName ? ` ${creator.lastName}` : '');
      const venueName = match.venue?.name || '';
      const dateStr = new Date(match.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Europe/Minsk' });
      const timeStr = new Date(match.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Minsk' });
      const text = `🎾 <b>Вас пригласили в матч!</b>\n👤 От: ${creatorName}\n📍 ${venueName}\n📅 ${dateStr} в ${timeStr}\n\nОткройте приложение чтобы принять или отклонить.`;
      await sendTelegramMessage(targetUser.telegramId.toString(), text);
    }

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: true,
        players: { include: { user: { select: { id: true, firstName: true, lastName: true, rating: true, photoUrl: true, username: true, isVip: true } } } },
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

      // Notify all players that the match is full
      try {
        const fullMatch = await prisma.match.findUnique({
          where: { id: matchId },
          include: { players: { where: { status: "APPROVED" }, include: { user: true } }, venue: true },
        });
        const playerNames = fullMatch.players.map((p) => p.user.firstName);
        for (const p of fullMatch.players) {
          notifyMatchFull(p.user.telegramId.toString(), fullMatch, playerNames).catch((e) => console.error("[Notify] error:", e.message));
        }
      } catch (e) { console.error("[MatchFull] notify error:", e.message); }
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
          include: { user: { select: { firstName: true, rating: true, isVip: true } } },
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
