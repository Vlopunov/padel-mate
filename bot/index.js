const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
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
const { faqCommand, handleFaqCallback, handleFaqBack } = require("./commands/faq");
const studentsCommand = require("./commands/students");
const scheduleCommand = require("./commands/schedule");

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
bot.onText(/^\/start(?:\s|$)/, (msg) => startCommand(bot, msg, MINI_APP_URL, API_URL));
bot.onText(/^\/rating(?:\s|$)/, (msg) => ratingCommand(bot, msg, API_URL));
bot.onText(/^\/matches(?:\s|$)/, (msg) => matchesCommand(bot, msg));
bot.onText(/^\/help(?:\s|$)/, (msg) => helpCommand(bot, msg, MINI_APP_URL));
bot.onText(/^\/stats(?:\s|$)/, (msg) => statsCommand(bot, msg));
bot.onText(/^\/me(?:\s|$)/, (msg) => meCommand(bot, msg));
bot.onText(/^\/top(?:\s|$)/, (msg) => topCommand(bot, msg));
bot.onText(/^\/find(?:\s|$)/, (msg) => findCommand(bot, msg));
bot.onText(/^\/create(?:\s|$)/, (msg) => startCreate(bot, msg));
bot.onText(/^\/cancel(?:\s|$)/, (msg) => cancelCommand(bot, msg));
bot.onText(/^\/faq(?:\s|$)/, (msg) => faqCommand(bot, msg));
bot.onText(/^\/students(?:\s|$)/, (msg) => studentsCommand(bot, msg));
bot.onText(/^\/schedule(?:\s|$)/, (msg) => scheduleCommand(bot, msg));

// ─── Callback Queries ──────────────────────────────
bot.on("callback_query", async (query) => {
  const data = query.data;

  // ── FAQ navigation ──
  if (data.startsWith("faq_") && data !== "faq_back") {
    return handleFaqCallback(bot, query);
  }
  if (data === "faq_back") {
    return handleFaqBack(bot, query);
  }

  // ── Create match flow (multi-step) ──
  if (data.startsWith("cr_")) {
    return handleCreateCallback(bot, query);
  }

  // ── Join match via bot (from /find or notifications) ──
  if (data.startsWith("bot_join_")) {
    const matchId = parseInt(data.replace("bot_join_", ""));
    if (isNaN(matchId) || matchId <= 0) {
      await bot.answerCallbackQuery(query.id, { text: "Неверный ID матча", show_alert: true });
      return;
    }
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
    if (isNaN(matchId) || matchId <= 0) {
      await bot.answerCallbackQuery(query.id, { text: "Неверный ID матча", show_alert: true });
      return;
    }
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

  // Catch-all: answer unknown callbacks to stop loading spinner
  try {
    await bot.answerCallbackQuery(query.id);
  } catch (_) {}
});

// ─── Telegram Stars Payments ─────────────────────────

// Pre-checkout: must answer within 10 seconds
bot.on("pre_checkout_query", async (query) => {
  try {
    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (err) {
    console.error("Pre-checkout error:", err);
    try {
      await bot.answerPreCheckoutQuery(query.id, false, { error_message: "Payment error, try again" });
    } catch (_) {}
  }
});

// Successful payment: activate subscription
bot.on("message", async (msg) => {
  if (!msg.successful_payment) return;

  const payment = msg.successful_payment;
  const telegramId = msg.from.id;

  try {
    let payload;
    try {
      payload = JSON.parse(payment.invoice_payload);
    } catch (_) {
      console.error("Invalid payment payload:", payment.invoice_payload);
      return;
    }

    const { userId, planId } = payload;

    const res = await fetch(`${API_URL}/api/subscriptions/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Token": BOT_TOKEN,
      },
      body: JSON.stringify({
        userId,
        planId,
        providerPaymentId: payment.telegram_payment_charge_id,
        totalAmount: payment.total_amount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const expiresDate = new Date(data.expiresAt).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long", year: "numeric",
      });
      await bot.sendMessage(telegramId,
        `\u2B50 <b>Padel GO PRO \u2014 \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D!</b>\n\n` +
        `\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443! \u0422\u0435\u043F\u0435\u0440\u044C \u0432\u0430\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0432\u0441\u0435 PRO-\u0444\u0443\u043D\u043A\u0446\u0438\u0438.\n` +
        `\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E: <b>${expiresDate}</b>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "\uD83D\uDCF1 \u041E\u0442\u043A\u0440\u044B\u0442\u044C Padel GO", web_app: { url: MINI_APP_URL } }],
            ],
          },
        }
      );
    } else {
      console.error("Activate subscription failed:", await res.text());
      await bot.sendMessage(telegramId,
        "\u274C \u041E\u043F\u043B\u0430\u0442\u0430 \u043F\u0440\u043E\u0448\u043B\u0430, \u043D\u043E \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u044F \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C. \u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 @lopunow \u0434\u043B\u044F \u0440\u0435\u0448\u0435\u043D\u0438\u044F."
      );
    }
  } catch (err) {
    console.error("Successful payment handler error:", err);
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
  { command: "schedule", description: "📅 Расписание тренировок" },
  { command: "students", description: "👨‍🏫 Мои ученики (тренер)" },
  { command: "faq", description: "❓ Частые вопросы" },
  { command: "stats", description: "📊 Статистика (админ)" },
  { command: "help", description: "📋 Помощь" },
]);
