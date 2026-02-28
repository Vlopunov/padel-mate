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

// ─── Training Sessions ───

// Create a training session
async function createSession(coachId, data) {
  const { type, date, durationMin, maxStudents, price, venueId, notes } = data;

  if (!date || !durationMin) {
    throw new Error("Укажите дату и длительность");
  }

  const sessionDate = new Date(date);
  if (sessionDate <= new Date()) {
    throw new Error("Дата должна быть в будущем");
  }

  const session = await prisma.trainingSession.create({
    data: {
      coachId,
      type: type || "INDIVIDUAL",
      date: sessionDate,
      durationMin: durationMin || 60,
      maxStudents: type === "GROUP" ? (maxStudents || 4) : 1,
      price: price || 0,
      venueId: venueId || null,
      notes: notes || null,
      status: "OPEN",
    },
    include: {
      venue: true,
      bookings: { include: { student: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } } } },
    },
  });

  return session;
}

// Update a training session
async function updateSession(coachId, sessionId, data) {
  const session = await prisma.trainingSession.findFirst({
    where: { id: sessionId, coachId },
  });
  if (!session) throw new Error("Тренировка не найдена");
  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    throw new Error("Нельзя редактировать завершённую/отменённую тренировку");
  }

  const updateData = {};
  if (data.date) updateData.date = new Date(data.date);
  if (data.durationMin) updateData.durationMin = data.durationMin;
  if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.venueId !== undefined) updateData.venueId = data.venueId || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.type) updateData.type = data.type;

  const updated = await prisma.trainingSession.update({
    where: { id: sessionId },
    data: updateData,
    include: {
      venue: true,
      bookings: { include: { student: { select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true } } } },
    },
  });

  return updated;
}

// Cancel a training session (notifies booked students)
async function cancelSession(coachId, sessionId) {
  const session = await prisma.trainingSession.findFirst({
    where: { id: sessionId, coachId },
    include: {
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        include: { student: { select: { id: true, firstName: true, telegramId: true } } },
      },
      venue: true,
      coach: { select: { firstName: true } },
    },
  });
  if (!session) throw new Error("Тренировка не найдена");

  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });

  // Cancel all active bookings
  await prisma.sessionBooking.updateMany({
    where: { sessionId, status: { in: ["PENDING", "CONFIRMED"] } },
    data: { status: "CANCELLED" },
  });

  // Return affected students for notification
  return {
    session,
    affectedStudents: session.bookings.map((b) => b.student),
  };
}

// Delete a session (only if no confirmed bookings)
async function deleteSession(coachId, sessionId) {
  const session = await prisma.trainingSession.findFirst({
    where: { id: sessionId, coachId },
    include: { bookings: { where: { status: { in: ["CONFIRMED", "PENDING"] } } } },
  });
  if (!session) throw new Error("Тренировка не найдена");
  if (session.bookings.length > 0) {
    throw new Error("Нельзя удалить тренировку с записанными учениками. Отмените сначала.");
  }

  await prisma.trainingSession.delete({ where: { id: sessionId } });
  return { success: true };
}

// Get coach schedule (sessions in a date range)
async function getCoachSchedule(coachId, { from, to } = {}) {
  const where = { coachId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const sessions = await prisma.trainingSession.findMany({
    where,
    include: {
      venue: true,
      bookings: {
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return sessions.map((s) => ({
    ...s,
    bookedCount: s.bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING").length,
  }));
}

// Get session detail with bookings
async function getSessionDetail(coachId, sessionId) {
  const session = await prisma.trainingSession.findFirst({
    where: { id: sessionId, coachId },
    include: {
      venue: true,
      bookings: {
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, photoUrl: true, rating: true, telegramId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!session) return null;
  return session;
}

// Complete a session
async function completeSession(coachId, sessionId) {
  const session = await prisma.trainingSession.findFirst({
    where: { id: sessionId, coachId },
  });
  if (!session) throw new Error("Тренировка не найдена");

  await prisma.trainingSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED" },
  });

  // Mark all confirmed bookings as completed (no separate status, just keep CONFIRMED)
  // Mark no-shows if needed later
  return { success: true };
}

// ─── Student Booking ───

// Book a session (student side)
async function bookSession(studentId, sessionId) {
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      bookings: { where: { status: { in: ["PENDING", "CONFIRMED"] } } },
      coach: { select: { id: true, firstName: true, telegramId: true } },
    },
  });
  if (!session) throw new Error("Тренировка не найдена");
  if (session.status === "CANCELLED" || session.status === "COMPLETED") {
    throw new Error("Тренировка недоступна");
  }
  if (session.date <= new Date()) {
    throw new Error("Тренировка уже прошла");
  }

  // Check if already booked
  const existing = await prisma.sessionBooking.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
  });
  if (existing && (existing.status === "PENDING" || existing.status === "CONFIRMED")) {
    throw new Error("Вы уже записаны");
  }

  // Check capacity
  if (session.bookings.length >= session.maxStudents) {
    throw new Error("Нет свободных мест");
  }

  // Verify the student is linked to this coach
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId: session.coachId, studentId } },
  });
  if (!link || !link.active) {
    throw new Error("Вы не являетесь учеником этого тренера");
  }

  // Upsert booking (re-book after cancellation)
  const booking = await prisma.sessionBooking.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    update: { status: "CONFIRMED" },
    create: { sessionId, studentId, status: "CONFIRMED" },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Update session status if full
  const activeBookings = session.bookings.length + 1;
  if (activeBookings >= session.maxStudents) {
    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { status: "FULL" },
    });
  }

  return { booking, session };
}

// Cancel booking (student side)
async function cancelBooking(studentId, sessionId) {
  const booking = await prisma.sessionBooking.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
    include: {
      session: {
        include: { coach: { select: { id: true, firstName: true, telegramId: true } } },
      },
    },
  });
  if (!booking) throw new Error("Бронирование не найдено");
  if (booking.status === "CANCELLED") throw new Error("Уже отменено");

  await prisma.sessionBooking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  // Re-open session if it was FULL
  if (booking.session.status === "FULL") {
    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: { status: "OPEN" },
    });
  }

  return { booking, session: booking.session };
}

// Get available sessions for a student
async function getAvailableSessions(studentId) {
  // Find all coaches this student is linked to
  const links = await prisma.coachStudent.findMany({
    where: { studentId, active: true },
    select: { coachId: true },
  });
  const coachIds = links.map((l) => l.coachId);

  if (coachIds.length === 0) return [];

  const sessions = await prisma.trainingSession.findMany({
    where: {
      coachId: { in: coachIds },
      status: { in: ["OPEN", "CONFIRMED"] },
      date: { gt: new Date() },
    },
    include: {
      venue: true,
      coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true, coachHourlyRate: true } },
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: { studentId: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return sessions.map((s) => ({
    ...s,
    bookedCount: s.bookings.length,
    isBooked: s.bookings.some((b) => b.studentId === studentId),
  }));
}

// Get student's booked sessions
async function getStudentSessions(studentId) {
  const bookings = await prisma.sessionBooking.findMany({
    where: {
      studentId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      session: {
        include: {
          venue: true,
          coach: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
    },
    orderBy: { session: { date: "asc" } },
  });

  // Only show upcoming
  const now = new Date();
  return bookings
    .filter((b) => b.session.date > now)
    .map((b) => ({
      bookingId: b.id,
      bookingStatus: b.status,
      ...b.session,
    }));
}

// ─── Notes & Homework ───

// Get notes for a student
async function getNotes(coachId, studentId) {
  // Verify link
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId, studentId } },
  });
  if (!link || !link.active) throw new Error("Ученик не найден");

  return prisma.coachNote.findMany({
    where: { coachId, studentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// Add a note/homework
async function addNote(coachId, studentId, { text, isHomework }) {
  if (!text || text.trim().length === 0) throw new Error("Текст не может быть пустым");

  // Verify link
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId, studentId } },
  });
  if (!link || !link.active) throw new Error("Ученик не найден");

  const note = await prisma.coachNote.create({
    data: {
      coachId,
      studentId,
      text: text.trim(),
      isHomework: isHomework || false,
    },
  });

  return note;
}

// Delete a note
async function deleteNote(coachId, noteId) {
  const note = await prisma.coachNote.findFirst({
    where: { id: noteId, coachId },
  });
  if (!note) throw new Error("Заметка не найдена");

  await prisma.coachNote.delete({ where: { id: noteId } });
  return { success: true };
}

// Get homework for a student (from all coaches)
async function getStudentHomework(studentId) {
  const homework = await prisma.coachNote.findMany({
    where: {
      studentId,
      isHomework: true,
    },
    include: {
      coach: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return homework;
}

// ─── Payments ───

// Record a payment
async function recordPayment(coachId, { studentId, amount, type, packageId, note, status }) {
  if (!studentId || !amount) throw new Error("Укажите ученика и сумму");

  // Verify student link
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId, studentId } },
  });
  if (!link || !link.active) throw new Error("Ученик не найден");

  const payment = await prisma.coachPayment.create({
    data: {
      coachId,
      studentId,
      amount,
      type: type || "SINGLE",
      packageId: packageId || null,
      note: note || null,
      status: status || "AWAITING",
      paidAt: status === "PAID" ? new Date() : null,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });

  return payment;
}

// Get all payments for coach (with filters)
async function getPayments(coachId, { studentId, status, from, to, limit } = {}) {
  const where = { coachId };
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const payments = await prisma.coachPayment.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      package: { select: { id: true, totalSessions: true, usedSessions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit || 100,
  });

  return payments;
}

// Update payment (mark paid, edit note)
async function updatePayment(coachId, paymentId, data) {
  const payment = await prisma.coachPayment.findFirst({
    where: { id: paymentId, coachId },
  });
  if (!payment) throw new Error("Платёж не найден");

  const updateData = {};
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "PAID" && !payment.paidAt) {
      updateData.paidAt = new Date();
    }
  }
  if (data.note !== undefined) updateData.note = data.note;
  if (data.amount !== undefined) updateData.amount = data.amount;

  const updated = await prisma.coachPayment.update({
    where: { id: paymentId },
    data: updateData,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });

  return updated;
}

// Delete a payment
async function deletePayment(coachId, paymentId) {
  const payment = await prisma.coachPayment.findFirst({
    where: { id: paymentId, coachId },
  });
  if (!payment) throw new Error("Платёж не найден");

  await prisma.coachPayment.delete({ where: { id: paymentId } });
  return { success: true };
}

// Get balance for a student (total owed - paid)
async function getStudentBalance(coachId, studentId) {
  // Total sessions conducted (completed) for this student
  const completedSessions = await prisma.sessionBooking.count({
    where: {
      studentId,
      session: { coachId, status: "COMPLETED" },
      status: "CONFIRMED",
    },
  });

  // All payments from this student
  const payments = await prisma.coachPayment.findMany({
    where: { coachId, studentId },
    select: { amount: true, status: true, type: true },
  });

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalAwaiting = payments
    .filter((p) => p.status === "AWAITING")
    .reduce((sum, p) => sum + p.amount, 0);

  // Active packages
  const packages = await prisma.coachPackage.findMany({
    where: { coachId, studentId, active: true },
    select: { totalSessions: true, usedSessions: true, priceTotal: true },
  });

  const packageSessionsLeft = packages.reduce(
    (sum, p) => sum + (p.totalSessions - p.usedSessions), 0
  );

  return {
    completedSessions,
    totalPaid,
    totalAwaiting,
    packageSessionsLeft,
    packages,
  };
}

// Create a package (bundle of sessions)
async function createPackage(coachId, { studentId, totalSessions, priceTotal }) {
  if (!studentId || !totalSessions || !priceTotal) {
    throw new Error("Укажите ученика, кол-во тренировок и цену");
  }

  // Verify link
  const link = await prisma.coachStudent.findUnique({
    where: { coachId_studentId: { coachId, studentId } },
  });
  if (!link || !link.active) throw new Error("Ученик не найден");

  const pkg = await prisma.coachPackage.create({
    data: {
      coachId,
      studentId,
      totalSessions,
      priceTotal,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });

  return pkg;
}

// Get all packages
async function getPackages(coachId, { studentId, activeOnly } = {}) {
  const where = { coachId };
  if (studentId) where.studentId = studentId;
  if (activeOnly) where.active = true;

  const packages = await prisma.coachPackage.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      payments: { select: { id: true, amount: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return packages;
}

// Update a package (use session, deactivate)
async function updatePackage(coachId, packageId, data) {
  const pkg = await prisma.coachPackage.findFirst({
    where: { id: packageId, coachId },
  });
  if (!pkg) throw new Error("Пакет не найден");

  const updateData = {};
  if (data.usedSessions !== undefined) updateData.usedSessions = data.usedSessions;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.totalSessions !== undefined) updateData.totalSessions = data.totalSessions;

  const updated = await prisma.coachPackage.update({
    where: { id: packageId },
    data: updateData,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });

  return updated;
}

// Use one session from a package
async function usePackageSession(coachId, packageId) {
  const pkg = await prisma.coachPackage.findFirst({
    where: { id: packageId, coachId },
  });
  if (!pkg) throw new Error("Пакет не найден");
  if (!pkg.active) throw new Error("Пакет неактивен");
  if (pkg.usedSessions >= pkg.totalSessions) throw new Error("Все тренировки в пакете использованы");

  const updated = await prisma.coachPackage.update({
    where: { id: packageId },
    data: {
      usedSessions: pkg.usedSessions + 1,
      active: pkg.usedSessions + 1 < pkg.totalSessions,
    },
  });

  return updated;
}

// Payment summary for dashboard
async function getPaymentSummary(coachId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // This month revenue
  const thisMonthPaid = await prisma.coachPayment.aggregate({
    where: { coachId, status: "PAID", paidAt: { gte: monthStart } },
    _sum: { amount: true },
    _count: true,
  });

  // Previous month revenue
  const prevMonthPaid = await prisma.coachPayment.aggregate({
    where: { coachId, status: "PAID", paidAt: { gte: prevMonthStart, lt: monthStart } },
    _sum: { amount: true },
  });

  // Total awaiting
  const awaiting = await prisma.coachPayment.aggregate({
    where: { coachId, status: "AWAITING" },
    _sum: { amount: true },
    _count: true,
  });

  // All-time total
  const allTime = await prisma.coachPayment.aggregate({
    where: { coachId, status: "PAID" },
    _sum: { amount: true },
  });

  // Per-student balances
  const students = await prisma.coachStudent.findMany({
    where: { coachId, active: true },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
    },
  });

  const studentBalances = await Promise.all(
    students.map(async (link) => {
      const studentAwaiting = await prisma.coachPayment.aggregate({
        where: { coachId, studentId: link.studentId, status: "AWAITING" },
        _sum: { amount: true },
      });
      const activePkgs = await prisma.coachPackage.findMany({
        where: { coachId, studentId: link.studentId, active: true },
        select: { totalSessions: true, usedSessions: true },
      });
      const sessionsLeft = activePkgs.reduce((s, p) => s + (p.totalSessions - p.usedSessions), 0);

      return {
        ...link.student,
        awaiting: studentAwaiting._sum.amount || 0,
        packageSessionsLeft: sessionsLeft,
      };
    })
  );

  return {
    thisMonth: thisMonthPaid._sum.amount || 0,
    thisMonthCount: thisMonthPaid._count || 0,
    prevMonth: prevMonthPaid._sum.amount || 0,
    totalAwaiting: awaiting._sum.amount || 0,
    awaitingCount: awaiting._count || 0,
    allTimeTotal: allTime._sum.amount || 0,
    studentBalances,
  };
}

module.exports = {
  getCoachStudents,
  getStudentAnalytics,
  addStudent,
  removeStudent,
  getCohortStats,
  MAX_FREE_STUDENTS,
  // Training Sessions
  createSession,
  updateSession,
  cancelSession,
  deleteSession,
  getCoachSchedule,
  getSessionDetail,
  completeSession,
  bookSession,
  cancelBooking,
  getAvailableSessions,
  getStudentSessions,
  // Notes
  getNotes,
  addNote,
  deleteNote,
  getStudentHomework,
  // Payments
  recordPayment,
  getPayments,
  updatePayment,
  deletePayment,
  getStudentBalance,
  createPackage,
  getPackages,
  updatePackage,
  usePackageSession,
  getPaymentSummary,
};
