const TelegramBot = require("node-telegram-bot-api");
const startCommand = require("./commands/start");
const ratingCommand = require("./commands/rating");
const matchesCommand = require("./commands/matches");
const helpCommand = require("./commands/help");
const statsCommand = require("./commands/stats");
const meCommand = require("./commands/me");
const topCommand = require("./commands/top");
const findCommand = require("./commands/find");
const cancelCommand = require("./commands/cancel");
const { startCreate, handleCreateCallback } = require("./commands/create");

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://your-domain.com";
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required — bot will not start");
  return;
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Prevent unhandled polling errors from crashing the process
bot.on("polling_error", (err) => {
  console.error("Bot polling error:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection (bot):", err.message);
});

console.log("Padel GO bot started!");

// ─── Text Commands ─────────────────────────────────
bot.onText(/\/start/, (msg) => startCommand(bot, msg, MINI_APP_URL, API_URL));
bot.onText(/\/rating/, (msg) => ratingCommand(bot, msg, API_URL));
bot.onText(/\/matches/, (msg) => matchesCommand(bot, msg));
bot.onText(/\/help/, (msg) => helpCommand(bot, msg, MINI_APP_URL));
bot.onText(/\/stats/, (msg) => statsCommand(bot, msg));
bot.onText(/\/me/, (msg) => meCommand(bot, msg));
bot.onText(/\/top/, (msg) => topCommand(bot, msg));
bot.onText(/\/find/, (msg) => findCommand(bot, msg));
bot.onText(/\/create/, (msg) => startCreate(bot, msg));
bot.onText(/\/cancel/, (msg) => cancelCommand(bot, msg));

// ─── Callback Queries ──────────────────────────────
bot.on("callback_query", async (query) => {
  const data = query.data;

  // ── Create match flow (multi-step) ──
  if (data.startsWith("cr_")) {
    return handleCreateCallback(bot, query);
  }

  // ── Join match via bot (from /find or notifications) ──
  if (data.startsWith("bot_join_")) {
    const matchId = parseInt(data.replace("bot_join_", ""));
    const telegramId = query.from.id;
    try {
      const { botJoinMatch } = require("../server/services/botData");
      const result = await botJoinMatch(telegramId, matchId);
      if (result.error) {
        await bot.answerCallbackQuery(query.id, { text: result.error, show_alert: true });
      } else {
        await bot.answerCallbackQuery(query.id, { text: "✅ Заявка отправлена! Ждите одобрения создателя." });
        await bot.sendMessage(
          query.message.chat.id,
          `✅ Вы подали заявку на матч #${matchId}. Создатель матча получит уведомление.`
        );
      }
    } catch (err) {
      console.error("Bot join error:", err);
      await bot.answerCallbackQuery(query.id, { text: "Ошибка. Попробуйте позже." });
    }
    return;
  }

  // ── Leave match via bot (from /cancel) ──
  if (data.startsWith("bot_leave_")) {
    const matchId = parseInt(data.replace("bot_leave_", ""));
    const telegramId = query.from.id;
    try {
      const { botLeaveMatch } = require("../server/services/botData");
      const result = await botLeaveMatch(telegramId, matchId);
      if (result.error) {
        await bot.answerCallbackQuery(query.id, { text: result.error, show_alert: true });
      } else {
        await bot.answerCallbackQuery(query.id, { text: "Вы вышли из матча" });
        await bot.sendMessage(
          query.message.chat.id,
          `👋 Вы вышли из матча #${matchId}.`
        );
      }
    } catch (err) {
      console.error("Bot leave error:", err);
      await bot.answerCallbackQuery(query.id, { text: "Ошибка. Попробуйте позже." });
    }
    return;
  }

  // ── Score confirmation ──
  if (data.startsWith("confirm_score_")) {
    const matchId = data.replace("confirm_score_", "");
    const telegramId = query.from.id;
    try {
      const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-confirm/${telegramId}`, {
        method: "POST",
        headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
      });
      if (res.ok) {
        await bot.answerCallbackQuery(query.id, { text: "Счёт подтверждён!" });
        await bot.sendMessage(
          query.message.chat.id,
          `✅ Вы подтвердили счёт матча #${matchId}. Рейтинг обновлён!`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "📱 Открыть Padel GO", web_app: { url: MINI_APP_URL } }],
              ],
            },
          }
        );
      } else {
        const err = await res.json().catch(() => ({}));
        await bot.answerCallbackQuery(query.id, { text: err.error || "Ошибка" });
        await bot.sendMessage(query.message.chat.id, `❌ ${err.error || "Ошибка подтверждения счёта"}`);
      }
    } catch (err) {
      console.error("Bot confirm score error:", err);
      await bot.answerCallbackQuery(query.id, { text: "Ошибка соединения с сервером" });
    }
    return;
  }

  // ── Score dispute ──
  if (data.startsWith("dispute_score_")) {
    const matchId = data.replace("dispute_score_", "");
    await bot.answerCallbackQuery(query.id, { text: "Счёт оспорен. Свяжитесь с другими игроками." });
    await bot.sendMessage(
      query.message.chat.id,
      `❌ Вы оспорили счёт матча #${matchId}. Свяжитесь с другими участниками для уточнения.`
    );
    return;
  }

  // ── Join approval ──
  if (data.startsWith("approve_join_")) {
    const parts = data.replace("approve_join_", "").split("_");
    const matchId = parts[0];
    const userId = parts[1];
    try {
      const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-approve/${userId}`, {
        method: "POST",
        headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
      });
      if (res.ok) {
        await bot.answerCallbackQuery(query.id, { text: "Игрок принят!" });
        await bot.sendMessage(query.message.chat.id, `✅ Игрок одобрен и добавлен в матч #${matchId}.`);
      } else {
        const err = await res.json().catch(() => ({}));
        await bot.answerCallbackQuery(query.id, { text: err.error || "Ошибка" });
      }
    } catch (err) {
      console.error("Bot approve error:", err);
      await bot.answerCallbackQuery(query.id, { text: "Ошибка соединения с сервером" });
    }
    return;
  }

  // ── Join rejection ──
  if (data.startsWith("reject_join_")) {
    const parts = data.replace("reject_join_", "").split("_");
    const matchId = parts[0];
    const userId = parts[1];
    try {
      const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-reject/${userId}`, {
        method: "POST",
        headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
      });
      if (res.ok) {
        await bot.answerCallbackQuery(query.id, { text: "Заявка отклонена" });
        await bot.sendMessage(query.message.chat.id, `❌ Заявка на матч #${matchId} отклонена.`);
      } else {
        const err = await res.json().catch(() => ({}));
        await bot.answerCallbackQuery(query.id, { text: err.error || "Ошибка" });
      }
    } catch (err) {
      console.error("Bot reject error:", err);
      await bot.answerCallbackQuery(query.id, { text: "Ошибка соединения с сервером" });
    }
    return;
  }
});

// ─── Set bot commands menu ─────────────────────────
bot.setMyCommands([
  { command: "start", description: "🎾 Запустить Padel GO" },
  { command: "me", description: "👤 Мой профиль" },
  { command: "top", description: "🏆 Таблица лидеров" },
  { command: "matches", description: "📅 Мои матчи" },
  { command: "find", description: "🔍 Найти матч" },
  { command: "create", description: "➕ Создать матч" },
  { command: "cancel", description: "❌ Выйти из матча" },
  { command: "stats", description: "📊 Статистика (админ)" },
  { command: "help", description: "❓ Помощь" },
]);
