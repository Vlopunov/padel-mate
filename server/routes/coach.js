const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Coach middleware
async function coachMiddleware(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || !user.isCoach) {
    return res.status(403).json({ error: "Нет доступа тренера" });
  }
  req.coachUser = user;
  next();
}

// GET /api/coach/dashboard — basic stats
router.get("/dashboard", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const coachId = req.userId;

    const studentCount = await prisma.coachStudent.count({
      where: { coachId, active: true },
    });

    const upcomingSessions = await prisma.trainingSession.count({
      where: {
        coachId,
        status: { in: ["OPEN", "FULL", "CONFIRMED"] },
        date: { gte: new Date() },
      },
    });

    const completedSessions = await prisma.trainingSession.count({
      where: { coachId, status: "COMPLETED" },
    });

    // Revenue this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthPayments = await prisma.coachPayment.aggregate({
      where: {
        coachId,
        status: "PAID",
        paidAt: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // Pending payments
    const pendingPayments = await prisma.coachPayment.aggregate({
      where: { coachId, status: "AWAITING" },
      _sum: { amount: true },
    });

    const tier = req.coachUser.coachSubscriptionTier || "FREE";
    const maxFreeStudents = 5;

    res.json({
      studentCount,
      upcomingSessions,
      completedSessions,
      revenueThisMonth: monthPayments._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
      tier,
      maxFreeStudents,
      isLimited: tier === "FREE" && studentCount >= maxFreeStudents,
      coach: {
        bio: req.coachUser.coachBio,
        experience: req.coachUser.coachExperience,
        hourlyRate: req.coachUser.coachHourlyRate,
        specialization: req.coachUser.coachSpecialization,
        rating: req.coachUser.coachRating,
        reviewCount: req.coachUser.coachReviewCount,
      },
    });
  } catch (err) {
    console.error("Coach dashboard error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// ─── Student Management ───

const coachData = require("../services/coachData");

// GET /api/coach/students — list all students with stats
router.get("/students", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const students = await coachData.getCoachStudents(req.userId);
    res.json(students);
  } catch (err) {
    console.error("Coach students error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/coach/students — add student by userId
router.post("/students", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Укажите userId" });

    const link = await coachData.addStudent(req.userId, parseInt(userId));
    res.json(link);
  } catch (err) {
    console.error("Coach add student error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// DELETE /api/coach/students/:studentId — remove student
router.delete("/students/:studentId", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const result = await coachData.removeStudent(req.userId, studentId);
    res.json(result);
  } catch (err) {
    console.error("Coach remove student error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// GET /api/coach/students/:studentId — detailed student analytics
router.get("/students/:studentId", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const analytics = await coachData.getStudentAnalytics(req.userId, studentId);
    if (!analytics) return res.status(404).json({ error: "Ученик не найден" });
    res.json(analytics);
  } catch (err) {
    console.error("Coach student detail error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/coach/cohort-stats — aggregate stats across all students
router.get("/cohort-stats", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const stats = await coachData.getCohortStats(req.userId);
    res.json(stats);
  } catch (err) {
    console.error("Coach cohort stats error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

module.exports = router;
