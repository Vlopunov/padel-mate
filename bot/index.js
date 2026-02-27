const TelegramBot = require("node-telegram-bot-api");
const startCommand = require("./commands/start");
const ratingCommand = require("./commands/rating");
const matchesCommand = require("./commands/matches");
const helpCommand = require("./commands/help");

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

// Commands
bot.onText(/\/start/, (msg) => startCommand(bot, msg, MINI_APP_URL, API_URL));
bot.onText(/\/rating/, (msg) => ratingCommand(bot, msg, API_URL));
bot.onText(/\/matches/, (msg) => matchesCommand(bot, msg, API_URL));
bot.onText(/\/help/, (msg) => helpCommand(bot, msg, MINI_APP_URL));

// Callback queries
bot.on("callback_query", async (query) => {
  const data = query.data;

  // Score confirmation via bot callback — calls backend bot-confirm endpoint
  if (data.startsWith("confirm_score_")) {
    const matchId = data.replace("confirm_score_", "");
    const telegramId = query.from.id;
    try {
      const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-confirm/${telegramId}`, {
        method: "POST",
        headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
      });
      if (res.ok) {
        const result = await res.json();
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
  }

  if (data.startsWith("dispute_score_")) {
    const matchId = data.replace("dispute_score_", "");
    await bot.answerCallbackQuery(query.id, { text: "Счёт оспорен. Свяжитесь с другими игроками." });
    await bot.sendMessage(
      query.message.chat.id,
      `❌ Вы оспорили счёт матча #${matchId}. Свяжитесь с другими участниками для уточнения.`
    );
  }

  // Join approval
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
  }

  // Join rejection
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
  }
});

// Set bot commands menu
bot.setMyCommands([
  { command: "start", description: "🎾 Запустить Padel GO" },
  { command: "rating", description: "📊 Мой рейтинг" },
  { command: "matches", description: "🎾 Ближайшие матчи" },
  { command: "help", description: "❓ Помощь" },
]);
