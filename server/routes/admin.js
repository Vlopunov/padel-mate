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

// Create test users for tournament testing
router.post("/test-users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const count = Math.min(parseInt(req.body.count) || 16, 30);

    const TEST_NAMES = [
      "Алексей", "Дмитрий", "Сергей", "Андрей", "Михаил",
      "Николай", "Павел", "Артём", "Кирилл", "Егор",
      "Максим", "Иван", "Роман", "Виктор", "Олег",
      "Антон", "Даниил", "Тимур", "Марк", "Лев",
      "Анна", "Мария", "Елена", "Ольга", "Наталья",
      "Татьяна", "Юлия", "Екатерина", "Дарья", "Алина",
    ];
    const TEST_LASTNAMES = [
      "Иванов", "Петров", "Сидоров", "Козлов", "Новиков",
      "Морозов", "Волков", "Зайцев", "Соловьёв", "Васильев",
      "Попов", "Кузнецов", "Лебедев", "Смирнов", "Фёдоров",
      "Егоров", "Макаров", "Орлов", "Андреев", "Павлов",
      "Белова", "Соколова", "Титова", "Крылова", "Климова",
      "Громова", "Панова", "Медведева", "Жукова", "Борисова",
    ];
    const POSITIONS = ["DERECHA", "REVES", "BOTH"];
    const HANDS = ["RIGHT", "LEFT"];
    const EXPERIENCES = ["BEGINNER", "LESS_YEAR", "ONE_THREE", "THREE_PLUS"];

    // Use telegramId range 9000000001+ for test users
    const existing = await prisma.user.findMany({
      where: { telegramId: { gte: 9000000001n } },
      select: { telegramId: true },
      orderBy: { telegramId: "desc" },
      take: 1,
    });
    let nextTgId = existing.length > 0 ? Number(existing[0].telegramId) + 1 : 9000000001;

    const created = [];
    for (let i = 0; i < count; i++) {
      const rating = 1200 + Math.floor(Math.random() * 600); // 1200-1800
      const user = await prisma.user.create({
        data: {
          telegramId: BigInt(nextTgId + i),
          firstName: TEST_NAMES[i % TEST_NAMES.length],
          lastName: TEST_LASTNAMES[i % TEST_LASTNAMES.length],
          username: `test_player_${nextTgId + i}`,
          city: "MINSK",
          hand: HANDS[Math.floor(Math.random() * 2)],
          position: POSITIONS[Math.floor(Math.random() * 3)],
          experience: EXPERIENCES[Math.floor(Math.random() * 4)],
          rating,
          onboarded: true,
        },
      });
      created.push({ id: user.id, name: `${user.firstName} ${user.lastName}`, rating });
    }

    res.json({ created: created.length, users: created });
  } catch (err) {
    console.error("Admin create test users error:", err);
    res.status(500).json({ error: "Ошибка создания тестовых юзеров" });
  }
});

// Delete all test users (telegramId >= 9000000001)
router.delete("/test-users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const testUsers = await prisma.user.findMany({
      where: { telegramId: { gte: 9000000001n } },
      select: { id: true },
    });
    const ids = testUsers.map(u => u.id);

    if (ids.length === 0) return res.json({ deleted: 0 });

    await prisma.$transaction(async (tx) => {
      await tx.matchComment.deleteMany({ where: { userId: { in: ids } } });
      await tx.matchPlayer.deleteMany({ where: { userId: { in: ids } } });
      await tx.scoreConfirmation.deleteMany({ where: { userId: { in: ids } } });
      await tx.ratingHistory.deleteMany({ where: { userId: { in: ids } } });
      await tx.userAchievement.deleteMany({ where: { userId: { in: ids } } });
      await tx.tournamentRegistration.deleteMany({
        where: { OR: [{ player1Id: { in: ids } }, { player2Id: { in: ids } }] },
      });
      await tx.tournamentRatingChange.deleteMany({ where: { userId: { in: ids } } });
      await tx.tournamentStanding.deleteMany({ where: { userId: { in: ids } } });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    });

    res.json({ deleted: ids.length });
  } catch (err) {
    console.error("Admin delete test users error:", err);
    res.status(500).json({ error: "Ошибка удаления тестовых юзеров" });
  }
});

// Seed test tournaments with test users (all-in-one)
router.post("/seed-tournaments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const TEST_NAMES = [
      "Алексей", "Дмитрий", "Сергей", "Андрей", "Михаил",
      "Николай", "Павел", "Артём", "Кирилл", "Егор",
      "Максим", "Иван", "Роман", "Виктор", "Олег",
      "Антон", "Даниил", "Тимур", "Марк", "Лев",
      "Анна", "Мария", "Елена", "Ольга",
    ];
    const TEST_LASTNAMES = [
      "Иванов", "Петров", "Сидоров", "Козлов", "Новиков",
      "Морозов", "Волков", "Зайцев", "Соловьёв", "Васильев",
      "Попов", "Кузнецов", "Лебедев", "Смирнов", "Фёдоров",
      "Егоров", "Макаров", "Орлов", "Андреев", "Павлов",
      "Белова", "Соколова", "Титова", "Крылова",
    ];
    const POSITIONS = ["DERECHA", "REVES", "BOTH"];
    const HANDS = ["RIGHT", "LEFT"];
    const EXPERIENCES = ["BEGINNER", "LESS_YEAR", "ONE_THREE", "THREE_PLUS"];

    // Find venue
    let venue = await prisma.venue.findFirst({ where: { city: "MINSK" } });
    if (!venue) {
      venue = await prisma.venue.create({
        data: { name: "Test Padel Club", address: "ул. Тестовая 1", city: "MINSK", courts: 4 },
      });
    }

    // Create 24 test users
    const existing = await prisma.user.findMany({
      where: { telegramId: { gte: 9000000001n } },
      select: { telegramId: true },
      orderBy: { telegramId: "desc" },
      take: 1,
    });
    let nextTgId = existing.length > 0 ? Number(existing[0].telegramId) + 1 : 9000000001;

    const testUsers = [];
    for (let i = 0; i < 24; i++) {
      const rating = 1200 + Math.floor(Math.random() * 600);
      const user = await prisma.user.create({
        data: {
          telegramId: BigInt(nextTgId + i),
          firstName: TEST_NAMES[i],
          lastName: TEST_LASTNAMES[i],
          username: `test_${nextTgId + i}`,
          city: "MINSK",
          hand: HANDS[Math.floor(Math.random() * 2)],
          position: POSITIONS[Math.floor(Math.random() * 3)],
          experience: EXPERIENCES[Math.floor(Math.random() * 4)],
          rating,
          onboarded: true,
        },
      });
      testUsers.push(user);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    // Tournament configs: 4 different tournaments
    const configs = [
      {
        name: "🎾 Americano Open 16",
        description: "Тестовый Americano турнир на 16 игроков, 2 корта",
        format: "americano",
        playerCount: 16,
        pointsPerMatch: 24,
        courtsCount: 2,
        hours: 0,
      },
      {
        name: "🌮 Mexicano Classic 16",
        description: "Тестовый Mexicano турнир на 16 игроков, 2 корта",
        format: "mexicano",
        playerCount: 16,
        pointsPerMatch: 24,
        courtsCount: 2,
        hours: 3,
      },
      {
        name: "⚡ Americano Sprint 20",
        description: "Тестовый Americano турнир на 20 игроков, 3 корта",
        format: "americano",
        playerCount: 20,
        pointsPerMatch: 32,
        courtsCount: 3,
        hours: 6,
      },
      {
        name: "🔥 Mexicano Pro 24",
        description: "Тестовый Mexicano турнир на 24 игрока, 3 корта",
        format: "mexicano",
        playerCount: 24,
        pointsPerMatch: 32,
        courtsCount: 3,
        hours: 9,
      },
    ];

    const created = [];

    for (const cfg of configs) {
      const date = new Date(tomorrow);
      date.setHours(date.getHours() + cfg.hours);

      const tournament = await prisma.tournament.create({
        data: {
          name: cfg.name,
          description: cfg.description,
          date,
          city: "MINSK",
          venueId: venue.id,
          format: cfg.format,
          levelMin: 1.0,
          levelMax: 4.0,
          maxTeams: cfg.playerCount,
          pointsPerMatch: cfg.pointsPerMatch,
          courtsCount: cfg.courtsCount,
          registrationMode: "INDIVIDUAL",
          status: "REGISTRATION",
        },
      });

      // Register players
      const players = testUsers.slice(0, cfg.playerCount);
      for (const player of players) {
        await prisma.tournamentRegistration.create({
          data: { tournamentId: tournament.id, player1Id: player.id },
        });
      }

      created.push({
        id: tournament.id,
        name: cfg.name,
        format: cfg.format,
        players: cfg.playerCount,
        courts: cfg.courtsCount,
        pointsPerMatch: cfg.pointsPerMatch,
      });
    }

    res.json({ created: created.length, tournaments: created, testUsers: testUsers.length });
  } catch (err) {
    console.error("Seed tournaments error:", err);
    res.status(500).json({ error: "Ошибка создания тестовых турниров: " + err.message });
  }
});

// Delete all test data (test users + their tournaments)
router.delete("/seed-tournaments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const testUsers = await prisma.user.findMany({
      where: { telegramId: { gte: 9000000001n } },
      select: { id: true },
    });
    const userIds = testUsers.map(u => u.id);

    if (userIds.length === 0) return res.json({ deleted: { users: 0, tournaments: 0 } });

    // Find tournaments that ONLY have test-user registrations
    const regs = await prisma.tournamentRegistration.findMany({
      where: { player1Id: { in: userIds } },
      select: { tournamentId: true },
    });
    const tournamentIds = [...new Set(regs.map(r => r.tournamentId))];

    // For each tournament, check if it has any non-test registrations
    const testOnlyTournaments = [];
    for (const tid of tournamentIds) {
      const nonTestRegs = await prisma.tournamentRegistration.count({
        where: { tournamentId: tid, player1Id: { notIn: userIds } },
      });
      if (nonTestRegs === 0) testOnlyTournaments.push(tid);
    }

    await prisma.$transaction(async (tx) => {
      // Delete tournament data for test-only tournaments
      if (testOnlyTournaments.length > 0) {
        await tx.tournamentRatingChange.deleteMany({ where: { tournamentId: { in: testOnlyTournaments } } });
        await tx.tournamentStanding.deleteMany({ where: { tournamentId: { in: testOnlyTournaments } } });
        await tx.tournamentMatch.deleteMany({ where: { tournamentId: { in: testOnlyTournaments } } });
        await tx.tournamentRound.deleteMany({ where: { tournamentId: { in: testOnlyTournaments } } });
        await tx.tournamentRegistration.deleteMany({ where: { tournamentId: { in: testOnlyTournaments } } });
        await tx.tournament.deleteMany({ where: { id: { in: testOnlyTournaments } } });
      }

      // Delete test users and their data
      await tx.matchComment.deleteMany({ where: { userId: { in: userIds } } });
      await tx.matchPlayer.deleteMany({ where: { userId: { in: userIds } } });
      await tx.scoreConfirmation.deleteMany({ where: { userId: { in: userIds } } });
      await tx.ratingHistory.deleteMany({ where: { userId: { in: userIds } } });
      await tx.userAchievement.deleteMany({ where: { userId: { in: userIds } } });
      await tx.tournamentRegistration.deleteMany({
        where: { OR: [{ player1Id: { in: userIds } }, { player2Id: { in: userIds } }] },
      });
      await tx.tournamentRatingChange.deleteMany({ where: { userId: { in: userIds } } });
      await tx.tournamentStanding.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    });

    res.json({ deleted: { users: userIds.length, tournaments: testOnlyTournaments.length } });
  } catch (err) {
    console.error("Delete seed tournaments error:", err);
    res.status(500).json({ error: "Ошибка удаления" });
  }
});

// Stats overview (enhanced with daily analytics)
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { getTodaySummary } = require("../services/analytics");

    const totalUsers = await prisma.user.count();
    const totalMatches = await prisma.match.count();
    const activeMatches = await prisma.match.count({ where: { status: { in: ["RECRUITING", "FULL"] } } });
    const completedMatches = await prisma.match.count({ where: { status: "COMPLETED" } });
    const totalTournaments = await prisma.tournament.count();

    // Today + yesterday snapshot for comparison
    const { today, yesterday } = await getTodaySummary();

    res.json({ totalUsers, totalMatches, activeMatches, completedMatches, totalTournaments, today, yesterday });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Analytics timeline (for charts)
router.get("/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { getDashboardData } = require("../services/analytics");
    const days = parseInt(req.query.days) || 30;
    const data = await getDashboardData(Math.min(days, 90));
    res.json(data);
  } catch (err) {
    console.error("Admin analytics error:", err);
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
        isAdmin: true, isVip: true, isCoach: true, coachSubscriptionTier: true,
        onboarded: true, createdAt: true, xp: true,
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
    const { rating, isAdmin, isVip, isCoach, coachSubscriptionTier, city } = req.body;
    const data = {};
    if (rating !== undefined) data.rating = parseInt(rating);
    if (isAdmin !== undefined) data.isAdmin = isAdmin;
    if (isVip !== undefined) data.isVip = isVip;
    if (isCoach !== undefined) data.isCoach = isCoach;
    if (coachSubscriptionTier !== undefined) data.coachSubscriptionTier = coachSubscriptionTier || null;
    if (city !== undefined) data.city = city;

    // Get old rating BEFORE update for correct history
    let oldRating = null;
    if (rating !== undefined) {
      const existing = await prisma.user.findUnique({ where: { id: userId }, select: { rating: true } });
      if (existing) oldRating = existing.rating;
    }

    await prisma.user.update({ where: { id: userId }, data });

    if (rating !== undefined && oldRating !== null) {
      const newRating = parseInt(rating);
      await prisma.ratingHistory.create({
        data: {
          userId,
          oldRating,
          newRating,
          change: newRating - oldRating,
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

    // Delete all related records in a single transaction for atomicity
    await prisma.$transaction(async (tx) => {
      await tx.matchComment.deleteMany({ where: { userId } });
      await tx.matchPlayer.deleteMany({ where: { userId } });
      await tx.scoreConfirmation.deleteMany({ where: { userId } });
      await tx.ratingHistory.deleteMany({ where: { userId } });
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.tournamentRegistration.deleteMany({
        where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
      });
      await tx.tournamentRatingChange.deleteMany({ where: { userId } });
      await tx.tournamentStanding.deleteMany({ where: { userId } });

      const createdMatches = await tx.match.findMany({ where: { creatorId: userId }, select: { id: true } });
      const createdMatchIds = createdMatches.map((m) => m.id);
      if (createdMatchIds.length > 0) {
        await tx.matchComment.deleteMany({ where: { matchId: { in: createdMatchIds } } });
        await tx.scoreConfirmation.deleteMany({ where: { matchId: { in: createdMatchIds } } });
        await tx.matchSet.deleteMany({ where: { matchId: { in: createdMatchIds } } });
        await tx.matchPlayer.deleteMany({ where: { matchId: { in: createdMatchIds } } });
        await tx.match.deleteMany({ where: { id: { in: createdMatchIds } } });
      }

      await tx.user.delete({ where: { id: userId } });
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// List all matches (extended data)
router.get("/matches", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        venue: true,
        creator: { select: { id: true, firstName: true, lastName: true, username: true, rating: true } },
        players: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, username: true, rating: true, photoUrl: true } },
          },
        },
        sets: { orderBy: { setNumber: "asc" } },
        confirmations: {
          include: {
            user: { select: { id: true, firstName: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, firstName: true, photoUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
    });
    res.json(matches);
  } catch (err) {
    console.error("Admin matches error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Update match (admin — no status restrictions)
router.patch("/matches/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const { venueId, date, durationMin, levelMin, levelMax, courtBooked, courtNumber, matchType, notes, status } = req.body;
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
    if (status !== undefined) data.status = status;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data,
      include: {
        venue: true,
        creator: { select: { id: true, firstName: true, lastName: true, username: true, rating: true } },
        players: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, username: true, rating: true, photoUrl: true } },
          },
        },
        sets: { orderBy: { setNumber: "asc" } },
        confirmations: {
          include: {
            user: { select: { id: true, firstName: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, firstName: true, photoUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Admin update match error:", err);
    res.status(500).json({ error: "Ошибка обновления матча" });
  }
});

// Remove player from match (admin)
router.delete("/matches/:id/remove-player/:userId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // Delete player record
    await prisma.matchPlayer.deleteMany({ where: { matchId, userId } });
    // Delete score confirmation if exists
    await prisma.scoreConfirmation.deleteMany({ where: { matchId, userId } });

    // Check remaining approved players — revert to RECRUITING if < 4
    const approvedCount = await prisma.matchPlayer.count({
      where: { matchId, status: "APPROVED" },
    });
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (match && match.status === "FULL" && approvedCount < 4) {
      await prisma.match.update({ where: { id: matchId }, data: { status: "RECRUITING" } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Admin remove player error:", err);
    res.status(500).json({ error: "Ошибка удаления игрока" });
  }
});

// Delete match (admin)
router.delete("/matches/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    await prisma.matchComment.deleteMany({ where: { matchId } });
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

// ─── Tournaments ───

// List all tournaments
router.get("/tournaments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        venue: true,
        registrations: {
          include: {
            player1: { select: { id: true, firstName: true, lastName: true, rating: true } },
            player2: { select: { id: true, firstName: true, lastName: true, rating: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });
    res.json(tournaments.map((t) => ({ ...t, teamsRegistered: t.registrations.length })));
  } catch (err) {
    console.error("Admin tournaments error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// Create tournament
router.post("/tournaments", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, date, endDate, city, venueId, format, levelMin, levelMax, maxTeams, price, ratingMultiplier, status, pointsPerMatch, courtsCount, registrationMode } = req.body;

    if (!name || !date || !city || !venueId || !format || levelMin === undefined || levelMax === undefined || !maxTeams) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || "",
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        city,
        venueId: parseInt(venueId),
        format,
        levelMin: parseFloat(levelMin),
        levelMax: parseFloat(levelMax),
        maxTeams: parseInt(maxTeams),
        price: price || null,
        ratingMultiplier: ratingMultiplier ? parseFloat(ratingMultiplier) : 1.0,
        status: status || "REGISTRATION",
        pointsPerMatch: pointsPerMatch ? parseInt(pointsPerMatch) : 24,
        courtsCount: courtsCount ? parseInt(courtsCount) : 1,
        registrationMode: registrationMode || "TEAMS",
      },
      include: { venue: true },
    });

    res.json(tournament);
  } catch (err) {
    console.error("Admin create tournament error:", err);
    res.status(500).json({ error: "Ошибка создания турнира" });
  }
});

// Update tournament
router.patch("/tournaments/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, date, endDate, city, venueId, format, levelMin, levelMax, maxTeams, price, ratingMultiplier, status, pointsPerMatch, courtsCount, registrationMode } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (date !== undefined) data.date = new Date(date);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (city !== undefined) data.city = city;
    if (venueId !== undefined) data.venueId = parseInt(venueId);
    if (format !== undefined) data.format = format;
    if (levelMin !== undefined) data.levelMin = parseFloat(levelMin);
    if (levelMax !== undefined) data.levelMax = parseFloat(levelMax);
    if (maxTeams !== undefined) data.maxTeams = parseInt(maxTeams);
    if (price !== undefined) data.price = price || null;
    if (ratingMultiplier !== undefined) data.ratingMultiplier = parseFloat(ratingMultiplier);
    if (status !== undefined) data.status = status;
    if (pointsPerMatch !== undefined) data.pointsPerMatch = parseInt(pointsPerMatch);
    if (courtsCount !== undefined) data.courtsCount = parseInt(courtsCount);
    if (registrationMode !== undefined) data.registrationMode = registrationMode;

    const tournament = await prisma.tournament.update({
      where: { id },
      data,
      include: { venue: true },
    });

    res.json(tournament);
  } catch (err) {
    console.error("Admin update tournament error:", err);
    res.status(500).json({ error: "Ошибка обновления турнира" });
  }
});

// Delete tournament (with all related data)
router.delete("/tournaments/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.tournamentRatingChange.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentStanding.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentRound.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: id } });
    await prisma.tournament.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete tournament error:", err);
    res.status(500).json({ error: "Ошибка удаления турнира" });
  }
});

// Add player to tournament (admin)
router.post("/tournaments/:id/add-player", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId обязателен" });

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ error: "Турнир не найден" });
    if (tournament.status !== "REGISTRATION") return res.status(400).json({ error: "Регистрация закрыта" });

    // Check not already registered
    const existing = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId,
        OR: [{ player1Id: parseInt(userId) }, { player2Id: parseInt(userId) }],
      },
    });
    if (existing) return res.status(400).json({ error: "Игрок уже зарегистрирован" });

    // Check max capacity
    const regCount = await prisma.tournamentRegistration.count({ where: { tournamentId } });
    if (regCount >= tournament.maxTeams) return res.status(400).json({ error: "Турнир заполнен" });

    const reg = await prisma.tournamentRegistration.create({
      data: { tournamentId, player1Id: parseInt(userId) },
      include: {
        player1: { select: { id: true, firstName: true, lastName: true, rating: true } },
        player2: { select: { id: true, firstName: true, lastName: true, rating: true } },
      },
    });

    res.json(reg);
  } catch (err) {
    console.error("Admin add player to tournament error:", err);
    res.status(500).json({ error: "Ошибка добавления игрока" });
  }
});

// Remove registration from tournament
router.delete("/tournaments/:id/registration/:regId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.tournamentRegistration.delete({ where: { id: parseInt(req.params.regId) } });
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete registration error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// ─── Tournament Live Engine (admin) ───

const {
  startTournament,
  submitScore,
  generateNextRound,
  completeTournament,
} = require("../services/tournamentEngine");

// Start tournament (generate rounds, create standings)
router.post("/tournaments/:id/start", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await startTournament(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    console.error("Admin start tournament error:", err);
    res.status(400).json({ error: err.message || "Ошибка запуска турнира" });
  }
});

// Submit match score
router.post("/tournaments/:id/score", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { matchId, team1Score, team2Score } = req.body;
    if (matchId === undefined || team1Score === undefined || team2Score === undefined) {
      return res.status(400).json({ error: "Укажите matchId, team1Score, team2Score" });
    }
    const result = await submitScore(
      parseInt(req.params.id),
      parseInt(matchId),
      parseInt(team1Score),
      parseInt(team2Score)
    );
    res.json(result);
  } catch (err) {
    console.error("Admin submit score error:", err);
    res.status(400).json({ error: err.message || "Ошибка записи счёта" });
  }
});

// Generate next round (Mexicano only)
router.post("/tournaments/:id/next-round", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await generateNextRound(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    console.error("Admin next round error:", err);
    res.status(400).json({ error: err.message || "Ошибка генерации раунда" });
  }
});

// Complete tournament (calculate ratings, finalize)
router.post("/tournaments/:id/complete", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await completeTournament(parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    console.error("Admin complete tournament error:", err);
    res.status(400).json({ error: err.message || "Ошибка завершения турнира" });
  }
});

module.exports = router;
