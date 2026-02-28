const { PrismaClient } = require("@prisma/client");
const { notifyMatchReminder, notifyMatchCancelled, sendTelegramMessage, notifyInactivePlayer, notifyWeeklySummary, notifyMilestone, notifyTrainingReminder } = require("./notifications");
const { collectDailyStats, getTodaySummary, formatDigestMessage, getUserWeeklySummary, getInactivePlayers, checkMilestones, getWeeklyReportData, formatWeeklyReport } = require("./analytics");

const prisma = new PrismaClient();

let isRunning = false;
let lastDigestDate = null;
let lastStatsHour = null;
let lastWeeklyDate = null;
let lastInactiveDate = null;

async function checkAndSendReminders() {
  if (isRunning) return; // prevent overlapping runs
  isRunning = true;

  try {
    const now = new Date();

    // Find upcoming matches (within the next 3 hours) that are RECRUITING or FULL
    const maxWindow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const upcomingMatches = await prisma.match.findMany({
      where: {
        date: {
          gt: now,
          lte: maxWindow,
        },
        status: { in: ["RECRUITING", "FULL"] },
      },
      include: {
        venue: true,
        players: {
          where: {
            status: "APPROVED",
            reminderSent: false,
          },
          include: {
            user: true,
          },
        },
      },
    });

    for (const match of upcomingMatches) {
      const matchTime = new Date(match.date).getTime();
      const minutesUntil = Math.floor((matchTime - now.getTime()) / 60000);

      for (const player of match.players) {
        const reminderMinutes = player.user.reminderMinutes;

        // Skip if reminders disabled
        if (!reminderMinutes || reminderMinutes <= 0) continue;

        // Check if it's time to send (within a 2-minute window to account for scheduler interval)
        if (minutesUntil <= reminderMinutes && minutesUntil >= reminderMinutes - 2) {
          try {
            await notifyMatchReminder(
              player.user.telegramId.toString(),
              match,
              minutesUntil
            );

            // Mark reminder as sent
            await prisma.matchPlayer.update({
              where: { id: player.id },
              data: { reminderSent: true },
            });

            console.log(
              `[Reminder] Sent to ${player.user.firstName} (${player.user.telegramId}) for match #${match.id} — ${minutesUntil} min before`
            );
          } catch (err) {
            console.error(
              `[Reminder] Failed to send to ${player.user.telegramId} for match #${match.id}:`,
              err.message
            );
          }
        }

        // Also send if match is very close (< reminderMinutes) and reminder hasn't been sent yet
        // This handles cases where the server was down during the ideal window
        if (minutesUntil < reminderMinutes && minutesUntil > 0) {
          try {
            await notifyMatchReminder(
              player.user.telegramId.toString(),
              match,
              minutesUntil
            );

            await prisma.matchPlayer.update({
              where: { id: player.id },
              data: { reminderSent: true },
            });

            console.log(
              `[Reminder] Late send to ${player.user.firstName} for match #${match.id} — ${minutesUntil} min before`
            );
          } catch (err) {
            console.error(
              `[Reminder] Failed late send for match #${match.id}:`,
              err.message
            );
          }
        }
      }
    }
    // --- Training session reminders ---
    await checkTrainingReminders(now);

    // --- Auto-cancel expired RECRUITING matches ---
    await cancelExpiredMatches(now);

    // --- Hourly stats collection ---
    await checkHourlyStatsCollection(now);

    // --- Daily digest at 21:00 Minsk time ---
    await checkDailyDigest(now);

    // --- Weekly summaries (Sunday 20:00 Minsk) ---
    await checkWeeklySummaries(now);

    // --- Inactive player nudge (Wednesday 18:00 Minsk) ---
    await checkInactivePlayerNudge(now);

    // --- Milestone checks (hourly) ---
    await checkPlatformMilestones(now);

  } catch (err) {
    console.error("[Reminder] Scheduler error:", err.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Send reminders for upcoming training sessions (2 hours before)
 */
async function checkTrainingReminders(now) {
  try {
    const reminderWindow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours ahead

    const upcomingSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gt: now,
          lte: reminderWindow,
        },
        status: { in: ["OPEN", "FULL", "CONFIRMED"] },
      },
      include: {
        venue: true,
        coach: { select: { firstName: true } },
        bookings: {
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            reminderSent: false,
          },
          include: {
            student: { select: { telegramId: true, firstName: true, reminderMinutes: true } },
          },
        },
      },
    });

    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.date).getTime();
      const minutesUntil = Math.floor((sessionTime - now.getTime()) / 60000);

      for (const booking of session.bookings) {
        // Use student's reminder preference or default 120 min for training
        const reminderMinutes = booking.student.reminderMinutes || 120;
        if (reminderMinutes <= 0) continue;

        // Send if within reminder window
        if (minutesUntil <= reminderMinutes && minutesUntil > 0) {
          try {
            await notifyTrainingReminder(
              booking.student.telegramId.toString(),
              { ...session, coach: session.coach },
              minutesUntil
            );
            await prisma.sessionBooking.update({
              where: { id: booking.id },
              data: { reminderSent: true },
            });
            console.log(`[TrainingReminder] Sent to ${booking.student.firstName} for session #${session.id}`);
          } catch (err) {
            console.error(`[TrainingReminder] Failed for session #${session.id}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error("[TrainingReminder] Error:", err.message);
  }
}

async function cancelExpiredMatches(now) {
  try {
    // Find RECRUITING matches whose start time has passed
    const expiredMatches = await prisma.match.findMany({
      where: {
        status: "RECRUITING",
        date: { lt: now },
      },
      include: {
        players: {
          where: { status: "APPROVED" },
          include: { user: true },
        },
        venue: true,
      },
    });

    for (const match of expiredMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: "CANCELLED" },
      });

      // Notify players that match was auto-cancelled
      for (const player of match.players) {
        try {
          await notifyMatchCancelled(
            player.user.telegramId.toString(),
            match
          );
        } catch (notifyErr) {
          // Notification failed — not critical
        }
      }

      console.log(`[AutoCancel] Match #${match.id} cancelled — expired while RECRUITING (${match.players.length}/4 players)`);
    }
  } catch (err) {
    console.error("[AutoCancel] Error:", err.message);
  }
}

/**
 * Collect stats once per hour (at minute 0-1) to keep DailyStats fresh
 */
async function checkHourlyStatsCollection(now) {
  const currentHour = now.getUTCHours();
  if (now.getMinutes() > 1) return;
  if (lastStatsHour === currentHour) return;
  lastStatsHour = currentHour;

  try {
    await collectDailyStats();
    console.log("[Analytics] Hourly stats collected");
  } catch (err) {
    console.error("[Analytics] Collection error:", err.message);
  }
}

/**
 * Send daily digest to all admins at 21:00 Minsk time (UTC+3)
 */
async function checkDailyDigest(now) {
  // Minsk is UTC+3 (no DST in Belarus)
  const minskHour = (now.getUTCHours() + 3) % 24;
  const minskMinute = now.getUTCMinutes();

  // Only fire at 21:00-21:01
  if (minskHour !== 21 || minskMinute > 1) return;

  // Calculate today's date in Minsk
  const minskOffset = 3 * 60 * 60 * 1000;
  const minskNow = new Date(now.getTime() + minskOffset);
  const todayStr = minskNow.toISOString().split("T")[0];

  // Only send once per day
  if (lastDigestDate === todayStr) return;
  lastDigestDate = todayStr;

  try {
    console.log("[Digest] Collecting daily stats and sending digest...");

    const { today, yesterday } = await getTodaySummary();
    const message = formatDigestMessage(today, yesterday);

    // Find all admin users
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { telegramId: true },
    });

    for (const admin of admins) {
      try {
        await sendTelegramMessage(admin.telegramId.toString(), message);
      } catch (err) {
        console.error(`[Digest] Failed to send to admin ${admin.telegramId}:`, err.message);
      }
    }

    console.log(`[Digest] Sent to ${admins.length} admin(s)`);
  } catch (err) {
    console.error("[Digest] Error:", err.message);
  }
}

/**
 * Weekly summaries for all players (Sunday 20:00 Minsk) +
 * Weekly admin report (Sunday 21:00 Minsk)
 */
async function checkWeeklySummaries(now) {
  const minskHour = (now.getUTCHours() + 3) % 24;
  const minskMinute = now.getUTCMinutes();
  const minskOffset = 3 * 60 * 60 * 1000;
  const minskNow = new Date(now.getTime() + minskOffset);
  const dayOfWeek = minskNow.getUTCDay(); // 0 = Sunday
  const todayStr = minskNow.toISOString().split("T")[0];

  if (dayOfWeek !== 0) return; // Only on Sundays
  if (lastWeeklyDate === todayStr) return; // Once per week

  // Player summaries at 20:00
  if (minskHour === 20 && minskMinute <= 1) {
    lastWeeklyDate = todayStr;
    try {
      console.log("[Weekly] Sending player weekly summaries...");
      const users = await prisma.user.findMany({
        where: { matchesPlayed: { gt: 0 } },
        select: { id: true },
      });

      let sent = 0;
      for (const u of users) {
        try {
          const summary = await getUserWeeklySummary(u.id);
          if (summary.matchesPlayed > 0 || summary.newAchievements > 0) {
            await notifyWeeklySummary(summary.telegramId, summary);
            sent++;
          }
        } catch (e) { /* skip user */ }
      }
      console.log(`[Weekly] Sent player summaries to ${sent} user(s)`);
    } catch (err) {
      console.error("[Weekly] Player summary error:", err.message);
    }
  }

  // Admin weekly report at 21:00
  if (minskHour === 21 && minskMinute <= 1) {
    try {
      console.log("[Weekly] Sending admin weekly report...");
      const weekData = await getWeeklyReportData();
      const message = formatWeeklyReport(weekData);

      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { telegramId: true },
      });

      for (const admin of admins) {
        sendTelegramMessage(admin.telegramId.toString(), message).catch(() => {});
      }
      console.log(`[Weekly] Admin report sent to ${admins.length} admin(s)`);
    } catch (err) {
      console.error("[Weekly] Admin report error:", err.message);
    }
  }
}

/**
 * Nudge inactive players (Wednesday 18:00 Minsk)
 */
async function checkInactivePlayerNudge(now) {
  const minskHour = (now.getUTCHours() + 3) % 24;
  const minskMinute = now.getUTCMinutes();
  const minskOffset = 3 * 60 * 60 * 1000;
  const minskNow = new Date(now.getTime() + minskOffset);
  const dayOfWeek = minskNow.getUTCDay(); // 3 = Wednesday
  const todayStr = minskNow.toISOString().split("T")[0];

  if (dayOfWeek !== 3) return;
  if (minskHour !== 18 || minskMinute > 1) return;
  if (lastInactiveDate === todayStr) return;
  lastInactiveDate = todayStr;

  try {
    console.log("[Inactive] Checking for inactive players...");
    const inactivePlayers = await getInactivePlayers(14);

    // Count available matches
    const availableMatches = await prisma.match.count({
      where: { status: "RECRUITING", date: { gt: now } },
    });

    let sent = 0;
    for (const player of inactivePlayers) {
      try {
        await notifyInactivePlayer(player.telegramId.toString(), player.firstName, availableMatches);
        sent++;
      } catch (e) { /* skip */ }
    }
    console.log(`[Inactive] Nudged ${sent} inactive player(s)`);
  } catch (err) {
    console.error("[Inactive] Error:", err.message);
  }
}

/**
 * Check platform milestones (hourly, near hour start)
 */
async function checkPlatformMilestones(now) {
  if (now.getMinutes() > 1) return; // Only near top of hour

  try {
    const milestones = await checkMilestones();
    if (milestones.length === 0) return;

    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { telegramId: true },
    });

    for (const milestone of milestones) {
      for (const admin of admins) {
        notifyMilestone(admin.telegramId.toString(), milestone).catch(() => {});
      }
    }
    console.log(`[Milestone] Sent ${milestones.length} milestone(s)`);
  } catch (err) {
    console.error("[Milestone] Error:", err.message);
  }
}

function startReminderScheduler() {
  console.log("[Reminder] Scheduler started — checking every 60 seconds");

  // Run immediately on startup
  checkAndSendReminders();

  // Then every 60 seconds
  setInterval(checkAndSendReminders, 60 * 1000);
}

module.exports = { startReminderScheduler };
