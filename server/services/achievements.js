const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkAndAwardAchievements(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  const existing = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const existingIds = new Set(existing.map((a) => a.achievementId));

  const allAchievements = await prisma.achievement.findMany();
  const newlyUnlocked = [];

  for (const achievement of allAchievements) {
    if (existingIds.has(achievement.id)) continue;

    const condition = achievement.condition;
    let earned = false;

    switch (condition.type) {
      case "matches_played":
        earned = user.matchesPlayed >= condition.value;
        break;

      case "win_streak":
        earned = user.maxWinStreak >= condition.value;
        break;

      case "winrate": {
        if (user.matchesPlayed >= (condition.minMatches || 20)) {
          const rate = (user.wins / user.matchesPlayed) * 100;
          earned = rate >= condition.value;
        }
        break;
      }

      case "rating_reached":
        earned = user.rating >= condition.value;
        break;

      case "matches_created": {
        const count = await prisma.match.count({ where: { creatorId: userId } });
        earned = count >= condition.value;
        break;
      }

      case "unique_partners": {
        const partners = await prisma.matchPlayer.findMany({
          where: { userId },
          select: { matchId: true, team: true },
        });
        const partnerIds = new Set();
        for (const mp of partners) {
          const teammates = await prisma.matchPlayer.findMany({
            where: { matchId: mp.matchId, team: mp.team, userId: { not: userId } },
            select: { userId: true },
          });
          teammates.forEach((t) => partnerIds.add(t.userId));
        }
        earned = partnerIds.size >= condition.value;
        break;
      }

      case "all_cities": {
        const matchPlayers = await prisma.matchPlayer.findMany({
          where: { userId },
          include: { match: { include: { venue: true } } },
        });
        const cities = new Set(matchPlayers.map((mp) => mp.match.venue.city));
        earned = cities.size >= condition.value;
        break;
      }

      case "all_venues": {
        const matchPlayers = await prisma.matchPlayer.findMany({
          where: { userId },
          include: { match: true },
        });
        const venueIds = new Set(matchPlayers.map((mp) => mp.match.venueId));
        earned = venueIds.size >= condition.value;
        break;
      }

      case "tournaments_played": {
        const count = await prisma.tournamentRegistration.count({
          where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
        });
        earned = count >= condition.value;
        break;
      }

      case "comeback":
      case "clean_sheet":
      case "giant_slayer":
      case "rating_week_gain":
      case "matches_month":
      case "tournament_wins":
        // These are checked at specific events (score submission, etc.)
        break;
    }

    if (earned) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: achievement.xp } },
      });
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

async function checkEventAchievement(userId, achievementId) {
  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  });
  if (existing) return null;

  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
  if (!achievement) return null;

  await prisma.userAchievement.create({
    data: { userId, achievementId },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: achievement.xp } },
  });

  return achievement;
}

module.exports = { checkAndAwardAchievements, checkEventAchievement };
