const { PrismaClient } = require("@prisma/client");
const { notifyMatchReminder } = require("./notifications");

const prisma = new PrismaClient();

let isRunning = false;

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
  } catch (err) {
    console.error("[Reminder] Scheduler error:", err.message);
  } finally {
    isRunning = false;
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
