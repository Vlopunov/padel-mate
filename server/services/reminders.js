const { PrismaClient } = require("@prisma/client");
const { notifyMatchReminder, notifyMatchCancelled, sendTelegramMessage } = require("./notifications");
const { collectDailyStats, getTodaySummary, formatDigestMessage } = require("./analytics");

const prisma = new PrismaClient();

let isRunning = false;
let lastDigestDate = null;
let lastStatsHour = null;

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
    // --- Auto-cancel expired RECRUITING matches ---
    await cancelExpiredMatches(now);

    // --- Hourly stats collection ---
    await checkHourlyStatsCollection(now);

    // --- Daily digest at 21:00 Minsk time ---
    await checkDailyDigest(now);

  } catch (err) {
    console.error("[Reminder] Scheduler error:", err.message);
  } finally {
    isRunning = false;
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

function startReminderScheduler() {
  console.log("[Reminder] Scheduler started — checking every 60 seconds");

  // Run immediately on startup
  checkAndSendReminders();

  // Then every 60 seconds
  setInterval(checkAndSendReminders, 60 * 1000);
}

module.exports = { startReminderScheduler };
