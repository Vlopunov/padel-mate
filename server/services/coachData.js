const { PrismaClient } = require("@prisma/client");
const { getLevel } = require("./rating");

const prisma = new PrismaClient();
const MAX_FREE_STUDENTS = 5;

// Get all students for a coach with stats
async function getCoachStudents(coachId) {
  const links = await prisma.coachStudent.findMany({
    where: { coachId, active: true },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          photoUrl: true,
          city: true,
          rating: true,
          matchesPlayed: true,
          wins: true,
          losses: true,
          winStreak: true,
          xp: true,
          isVip: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // For each student, compute rating growth since linked
  const students = await Promise.all(
    links.map(async (link) => {
      const s = link.student;
      const winRate = s.matchesPlayed > 0 ? Math.round((s.wins / s.matchesPlayed) * 100) : 0;

      // Rating when student was linked
      const ratingAtLink = await prisma.ratingHistory.findFirst({
        where: {
          userId: s.id,
          createdAt: { gte: link.createdAt },
        },
        orderBy: { createdAt: "asc" },
        select: { oldRating: true },
      });
      const startRating = ratingAtLink ? ratingAtLink.oldRating : s.rating;
      const ratingGrowth = s.rating - startRating;

      // Recent rating trend (last 5 changes)
      const recentHistory = await prisma.ratingHistory.findMany({
        where: { userId: s.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { newRating: true, change: true, createdAt: true },
      });

      const level = getLevel(s.rating);

      return {
        linkId: link.id,
        linkedAt: link.createdAt,
        ...s,
        winRate,
        ratingGrowth,
        startRating,
        level: level.level,
        levelCategory: level.category,
        levelName: level.name,
        recentHistory: recentHistory.reverse(),
      };
    })
  );

  return students;
}

// Get detailed analytics for a single student
async function getStudentAnalytics(coachId, studentId) {
  // Verify this is coach's student
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId, studentId } },
  });
  if (!link || !link.active) return null;

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      photoUrl: true,
      city: true,
      hand: true,
      position: true,
      experience: true,
      rating: true,
      matchesPlayed: true,
      wins: true,
      losses: true,
      winStreak: true,
      maxWinStreak: true,
      xp: true,
      isVip: true,
    },
  });
  if (!student) return null;

  // Rating history (last 30)
  const ratingHistory = await prisma.ratingHistory.findMany({
    where: { userId: studentId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Match history (last 20)
  const matchHistory = await prisma.matchPlayer.findMany({
    where: { userId: studentId },
    include: {
      match: {
        include: {
          venue: true,
          sets: { orderBy: { setNumber: "asc" } },
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  rating: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { match: { date: "desc" } },
    take: 20,
  });

  // Achievements
  const achievements = await prisma.userAchievement.findMany({
    where: { userId: studentId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
    take: 10,
  });

  // Coach notes for this student
  const notes = await prisma.coachNote.findMany({
    where: { coachId, studentId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Rating at link time
  const ratingAtLink = await prisma.ratingHistory.findFirst({
    where: {
      userId: studentId,
      createdAt: { gte: link.createdAt },
    },
    orderBy: { createdAt: "asc" },
    select: { oldRating: true },
  });
  const startRating = ratingAtLink ? ratingAtLink.oldRating : student.rating;

  const winRate =
    student.matchesPlayed > 0 ? Math.round((student.wins / student.matchesPlayed) * 100) : 0;
  const level = getLevel(student.rating);

  return {
    ...student,
    winRate,
    ratingGrowth: student.rating - startRating,
    startRating,
    linkedAt: link.createdAt,
    level: level.level,
    levelCategory: level.category,
    levelName: level.name,
    ratingHistory: ratingHistory.reverse(),
    matchHistory: matchHistory.map((mp) => ({
      ...mp.match,
      myTeam: mp.team,
    })),
    achievements: achievements.map((a) => ({
      ...a.achievement,
      unlockedAt: a.unlockedAt,
    })),
    notes,
  };
}

// Add a student
async function addStudent(coachId, studentId) {
  // Check self-link
  if (coachId === studentId) {
    throw new Error("Нельзя добавить себя");
  }

  // Check student exists
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Пользователь не найден");

  // Check free tier limit
  const coach = await prisma.user.findUnique({ where: { id: coachId } });
  if (!coach.coachSubscriptionTier || coach.coachSubscriptionTier === "FREE") {
    const count = await prisma.coachStudent.count({
      where: { coachId, active: true },
    });
    if (count >= MAX_FREE_STUDENTS) {
      throw new Error(`Лимит бесплатного тарифа: ${MAX_FREE_STUDENTS} учеников`);
    }
  }

  // Upsert — reactivate if was deactivated
  const link = await prisma.coachStudent.upsert({
    where: { coachId_studentId: { coachId, studentId } },
    update: { active: true },
    create: { coachId, studentId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
          rating: true,
          city: true,
        },
      },
    },
  });

  return link;
}

// Remove a student (soft-delete)
async function removeStudent(coachId, studentId) {
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId, studentId } },
  });
  if (!link) throw new Error("Ученик не найден");

  await prisma.coachStudent.update({
    where: { id: link.id },
    data: { active: false },
  });

  return { success: true };
}

// Get cohort-level stats
async function getCohortStats(coachId) {
  const links = await prisma.coachStudent.findMany({
    where: { coachId, active: true },
    include: {
      student: {
        select: {
          id: true,
          rating: true,
          matchesPlayed: true,
          wins: true,
          losses: true,
        },
      },
    },
  });

  if (links.length === 0) {
    return {
      totalStudents: 0,
      avgRating: 0,
      avgWinRate: 0,
      avgRatingGrowth: 0,
      mostActive: null,
      totalMatches: 0,
    };
  }

  let totalRating = 0;
  let totalWinRate = 0;
  let totalGrowth = 0;
  let totalMatches = 0;
  let mostActive = null;
  let maxMatches = 0;

  for (const link of links) {
    const s = link.student;
    totalRating += s.rating;
    totalMatches += s.matchesPlayed;

    const wr = s.matchesPlayed > 0 ? Math.round((s.wins / s.matchesPlayed) * 100) : 0;
    totalWinRate += wr;

    // Rating growth since link
    const ratingAtLink = await prisma.ratingHistory.findFirst({
      where: { userId: s.id, createdAt: { gte: link.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { oldRating: true },
    });
    const startRating = ratingAtLink ? ratingAtLink.oldRating : s.rating;
    totalGrowth += s.rating - startRating;

    if (s.matchesPlayed > maxMatches) {
      maxMatches = s.matchesPlayed;
      mostActive = s.id;
    }
  }

  const n = links.length;
  return {
    totalStudents: n,
    avgRating: Math.round(totalRating / n),
    avgWinRate: Math.round(totalWinRate / n),
    avgRatingGrowth: Math.round(totalGrowth / n),
    mostActiveId: mostActive,
    totalMatches,
  };
}

module.exports = {
  getCoachStudents,
  getStudentAnalytics,
  addStudent,
  removeStudent,
  getCohortStats,
  MAX_FREE_STUDENTS,
};
