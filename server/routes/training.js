const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const coachData = require("../services/coachData");
const { notifyTrainingBooked, notifyTrainingCancelledByStudent } = require("../services/notifications");

const router = express.Router();

// GET /api/training/available — available sessions for the student
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const sessions = await coachData.getAvailableSessions(req.userId);
    res.json(sessions);
  } catch (err) {
    console.error("Training available error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// GET /api/training/my — student's booked sessions
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const sessions = await coachData.getStudentSessions(req.userId);
    res.json(sessions);
  } catch (err) {
    console.error("Training my sessions error:", err);
    res.status(500).json({ error: "Ошибка" });
  }
});

// POST /api/training/book/:id — book a session
router.post("/book/:id", authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { booking, session } = await coachData.bookSession(req.userId, sessionId);

    // Notify coach about new booking
    try {
      await notifyTrainingBooked(
        session.coach.telegramId.toString(),
        session,
        booking.student
      );
    } catch (e) { /* notification failed — not critical */ }

    res.json(booking);
  } catch (err) {
    console.error("Training book error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

// DELETE /api/training/book/:id — cancel booking
router.delete("/book/:id", authMiddleware, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { booking, session } = await coachData.cancelBooking(req.userId, sessionId);

    // Notify coach about cancellation
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      const student = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { firstName: true, lastName: true },
      });
      await notifyTrainingCancelledByStudent(
        session.coach.telegramId.toString(),
        session,
        student
      );
    } catch (e) { /* notification failed — not critical */ }

    res.json({ success: true });
  } catch (err) {
    console.error("Training cancel error:", err);
    res.status(400).json({ error: err.message || "Ошибка" });
  }
});

module.exports = router;
