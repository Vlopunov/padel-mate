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

// PATCH /api/coach/profile — edit public coach profile
router.patch("/profile", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { bio, experience, specialization, hourlyRate, certificates } = req.body;
    const updateData = {};
    if (bio !== undefined) updateData.coachBio = bio || null;
    if (experience !== undefined) updateData.coachExperience = experience || null;
    if (specialization !== undefined) updateData.coachSpecialization = specialization || null;
    if (hourlyRate !== undefined) updateData.coachHourlyRate = hourlyRate ? parseInt(hourlyRate) : null;
    if (certificates !== undefined) updateData.coachCertificates = certificates || null;

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        coachBio: true,
        coachExperience: true,
        coachSpecialization: true,
        coachHourlyRate: true,
        coachCertificates: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Coach update profile error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

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

// ─── Training Sessions ───

const { notifyTrainingBooked, notifyTrainingCancelled, notifyTrainingCancelledByCoach, notifyHomework, notifyCoachNote } = require("../services/notifications");

// GET /api/coach/sessions — list sessions
router.get("/sessions", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;
    const sessions = await coachData.getCoachSchedule(req.userId, { from, to });
    res.json(sessions);
  } catch (err) {
    console.error("Coach sessions error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/coach/sessions/:id — session detail
router.get("/sessions/:id", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const session = await coachData.getSessionDetail(req.userId, parseInt(req.params.id));
    if (!session) return res.status(404).json({ error: "Не найдено" });
    res.json(session);
  } catch (err) {
    console.error("Coach session detail error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/coach/sessions — create session
router.post("/sessions", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const session = await coachData.createSession(req.userId, req.body);
    res.json(session);
  } catch (err) {
    console.error("Coach create session error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// PATCH /api/coach/sessions/:id — update session
router.patch("/sessions/:id", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const session = await coachData.updateSession(req.userId, parseInt(req.params.id), req.body);
    res.json(session);
  } catch (err) {
    console.error("Coach update session error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// DELETE /api/coach/sessions/:id — delete session (no bookings)
router.delete("/sessions/:id", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const result = await coachData.deleteSession(req.userId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    console.error("Coach delete session error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// POST /api/coach/sessions/:id/cancel — cancel session (notifies students)
router.post("/sessions/:id/cancel", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { session, affectedStudents } = await coachData.cancelSession(req.userId, parseInt(req.params.id));

    // Notify students
    for (const student of affectedStudents) {
      try {
        await notifyTrainingCancelledByCoach(
          student.telegramId.toString(),
          session,
          session.coach?.firstName || "Тренер"
        );
      } catch (e) { /* notification failed — not critical */ }
    }

    res.json({ success: true, cancelled: affectedStudents.length });
  } catch (err) {
    console.error("Coach cancel session error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// POST /api/coach/sessions/:id/complete — mark session as completed
router.post("/sessions/:id/complete", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const result = await coachData.completeSession(req.userId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    console.error("Coach complete session error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// ─── Notes & Homework ───

// GET /api/coach/students/:studentId/notes — list notes for student
router.get("/students/:studentId/notes", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const notes = await coachData.getNotes(req.userId, studentId);
    res.json(notes);
  } catch (err) {
    console.error("Coach get notes error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// POST /api/coach/students/:studentId/notes — add note
router.post("/students/:studentId/notes", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { text, isHomework } = req.body;
    const note = await coachData.addNote(req.userId, studentId, { text, isHomework });

    // Notify student
    try {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { telegramId: true, firstName: true },
      });
      if (student && student.telegramId) {
        if (isHomework) {
          await notifyHomework(
            student.telegramId.toString(),
            req.coachUser.firstName,
            text
          );
        } else {
          await notifyCoachNote(
            student.telegramId.toString(),
            req.coachUser.firstName,
            text
          );
        }
      }
    } catch (e) { /* notification failed — not critical */ }

    res.json(note);
  } catch (err) {
    console.error("Coach add note error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// DELETE /api/coach/notes/:noteId — delete note
router.delete("/notes/:noteId", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const noteId = parseInt(req.params.noteId);
    const result = await coachData.deleteNote(req.userId, noteId);
    res.json(result);
  } catch (err) {
    console.error("Coach delete note error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// ─── Payments ───

// GET /api/coach/payments — list payments (with optional filters)
router.get("/payments", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { studentId, status, from, to } = req.query;
    const payments = await coachData.getPayments(req.userId, {
      studentId: studentId ? parseInt(studentId) : undefined,
      status,
      from,
      to,
    });
    res.json(payments);
  } catch (err) {
    console.error("Coach payments error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/coach/payments — record a payment
router.post("/payments", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { studentId, amount, type, packageId, note, status } = req.body;
    const payment = await coachData.recordPayment(req.userId, {
      studentId: parseInt(studentId),
      amount: parseInt(amount),
      type,
      packageId: packageId ? parseInt(packageId) : null,
      note,
      status,
    });
    res.json(payment);
  } catch (err) {
    console.error("Coach record payment error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// PATCH /api/coach/payments/:id — update payment (mark paid, edit)
router.patch("/payments/:id", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const payment = await coachData.updatePayment(req.userId, paymentId, req.body);
    res.json(payment);
  } catch (err) {
    console.error("Coach update payment error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// DELETE /api/coach/payments/:id — delete payment
router.delete("/payments/:id", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const result = await coachData.deletePayment(req.userId, paymentId);
    res.json(result);
  } catch (err) {
    console.error("Coach delete payment error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// GET /api/coach/students/:studentId/balance — student balance
router.get("/students/:studentId/balance", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const balance = await coachData.getStudentBalance(req.userId, studentId);
    res.json(balance);
  } catch (err) {
    console.error("Coach student balance error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// GET /api/coach/packages — list packages
router.get("/packages", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { studentId, activeOnly } = req.query;
    const packages = await coachData.getPackages(req.userId, {
      studentId: studentId ? parseInt(studentId) : undefined,
      activeOnly: activeOnly === "true",
    });
    res.json(packages);
  } catch (err) {
    console.error("Coach packages error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/coach/packages — create a package
router.post("/packages", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const { studentId, totalSessions, priceTotal } = req.body;
    const pkg = await coachData.createPackage(req.userId, {
      studentId: parseInt(studentId),
      totalSessions: parseInt(totalSessions),
      priceTotal: parseInt(priceTotal),
    });
    res.json(pkg);
  } catch (err) {
    console.error("Coach create package error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// PATCH /api/coach/packages/:id — update package
router.patch("/packages/:id", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const pkg = await coachData.updatePackage(req.userId, packageId, req.body);
    res.json(pkg);
  } catch (err) {
    console.error("Coach update package error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// POST /api/coach/packages/:id/use — use one session from package
router.post("/packages/:id/use", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const pkg = await coachData.usePackageSession(req.userId, packageId);
    res.json(pkg);
  } catch (err) {
    console.error("Coach use package session error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// GET /api/coach/payment-summary — aggregated payment stats
router.get("/payment-summary", authMiddleware, coachMiddleware, async (req, res) => {
  try {
    const summary = await coachData.getPaymentSummary(req.userId);
    res.json(summary);
  } catch (err) {
    console.error("Coach payment summary error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

module.exports = router;
