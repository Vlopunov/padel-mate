const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/coaches — public list of coaches
router.get("/", async (req, res) => {
  try {
    const { city } = req.query;
    const where = { isCoach: true };
    if (city) where.city = city;

    const coaches = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        city: true,
        coachBio: true,
        coachExperience: true,
        coachSpecialization: true,
        coachHourlyRate: true,
        coachRating: true,
        coachReviewCount: true,
        coachCertificates: true,
        _count: {
          select: {
            coachStudents: { where: { active: true } },
          },
        },
      },
      orderBy: [
        { coachRating: { sort: "desc", nulls: "last" } },
        { coachReviewCount: "desc" },
      ],
    });

    const result = coaches.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      username: c.username,
      photoUrl: c.photoUrl,
      city: c.city,
      bio: c.coachBio,
      experience: c.coachExperience,
      specialization: c.coachSpecialization,
      hourlyRate: c.coachHourlyRate,
      rating: c.coachRating,
      reviewCount: c.coachReviewCount,
      certificates: c.coachCertificates,
      studentCount: c._count.coachStudents,
    }));

    res.json(result);
  } catch (err) {
    console.error("List coaches error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/coaches/:id — public coach profile
router.get("/:id", async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);

    const coach = await prisma.user.findFirst({
      where: { id: coachId, isCoach: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        city: true,
        coachBio: true,
        coachExperience: true,
        coachSpecialization: true,
        coachHourlyRate: true,
        coachRating: true,
        coachReviewCount: true,
        coachCertificates: true,
        rating: true,
        matchesPlayed: true,
        wins: true,
        _count: {
          select: {
            coachStudents: { where: { active: true } },
            coachSessions: { where: { status: "COMPLETED" } },
          },
        },
      },
    });

    if (!coach) return res.status(404).json({ error: "Тренер не найден" });

    // Latest reviews
    const reviews = await prisma.coachReview.findMany({
      where: { coachId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Available upcoming sessions
    const upcomingSessions = await prisma.trainingSession.findMany({
      where: {
        coachId,
        status: { in: ["OPEN"] },
        date: { gt: new Date() },
      },
      include: {
        venue: true,
        bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } }, select: { id: true } },
      },
      orderBy: { date: "asc" },
      take: 5,
    });

    res.json({
      id: coach.id,
      firstName: coach.firstName,
      lastName: coach.lastName,
      username: coach.username,
      photoUrl: coach.photoUrl,
      city: coach.city,
      bio: coach.coachBio,
      experience: coach.coachExperience,
      specialization: coach.coachSpecialization,
      hourlyRate: coach.coachHourlyRate,
      rating: coach.coachRating,
      reviewCount: coach.coachReviewCount,
      certificates: coach.coachCertificates,
      playerRating: coach.rating,
      matchesPlayed: coach.matchesPlayed,
      wins: coach.wins,
      studentCount: coach._count.coachStudents,
      completedSessions: coach._count.coachSessions,
      reviews,
      upcomingSessions: upcomingSessions.map((s) => ({
        ...s,
        bookedCount: s.bookings.length,
      })),
    });
  } catch (err) {
    console.error("Coach profile error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/coaches/:id/reviews — all reviews
router.get("/:id/reviews", async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    const reviews = await prisma.coachReview.findMany({
      where: { coachId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    console.error("Coach reviews error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/coaches/:id/reviews — write a review (auth required)
router.post("/:id/reviews", authMiddleware, async (req, res) => {
  try {
    const coachId = parseInt(req.params.id);
    const authorId = req.userId;
    const { rating, text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Оценка от 1 до 5" });
    }

    // Can't review yourself
    if (coachId === authorId) {
      return res.status(400).json({ error: "Нельзя написать отзыв себе" });
    }

    // Check coach exists
    const coach = await prisma.user.findFirst({ where: { id: coachId, isCoach: true } });
    if (!coach) return res.status(404).json({ error: "Тренер не найден" });

    // Upsert — one review per user per coach
    const review = await prisma.coachReview.upsert({
      where: { coachId_authorId: { coachId, authorId } },
      update: { rating, text: text || null },
      create: { coachId, authorId, rating, text: text || null },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true },
        },
      },
    });

    // Recalculate coach rating
    const agg = await prisma.coachReview.aggregate({
      where: { coachId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.user.update({
      where: { id: coachId },
      data: {
        coachRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
        coachReviewCount: agg._count,
      },
    });

    res.json(review);
  } catch (err) {
    console.error("Write review error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

module.exports = router;
