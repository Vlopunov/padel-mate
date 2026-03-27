import { Bot, Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ─── Commands ────────────────────────────────────
import { startCommand } from "./commands/start.js";
import { helpCommand } from "./commands/help.js";
import { ratingCommand } from "./commands/rating.js";
import { matchesCommand } from "./commands/matches.js";
import { meCommand } from "./commands/me.js";
import { topCommand } from "./commands/top.js";
import { findCommand } from "./commands/find.js";
import { cancelCommand } from "./commands/cancel.js";
import { startCreate, handleCreateCallback } from "./commands/create.js";
import { faqCommand, FAQ_SECTIONS } from "./commands/faq.js";
import { statsCommand } from "./commands/stats.js";
import { studentsCommand } from "./commands/students.js";
import { scheduleCommand } from "./commands/schedule.js";

// ─── Config ──────────────────────────────────────
const BOT_TOKEN = process.env.MAX_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://your-domain.com";
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

if (!BOT_TOKEN) {
  console.error("MAX_BOT_TOKEN is required — bot will not start");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ─── Error handling ──────────────────────────────
bot.catch((err) => {
  console.error("MAX bot error:", err.message || err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection (max-bot):", err.message || err);
});

// ─── Text Commands ───────────────────────────────
bot.command("start", (ctx) => startCommand(ctx, MINI_APP_URL, API_URL));
bot.command("help", (ctx) => helpCommand(ctx, MINI_APP_URL));
bot.command("rating", (ctx) => ratingCommand(ctx, MINI_APP_URL));
bot.command("matches", (ctx) => matchesCommand(ctx, MINI_APP_URL));
bot.command("me", (ctx) => meCommand(ctx, MINI_APP_URL));
bot.command("top", (ctx) => topCommand(ctx, MINI_APP_URL));
bot.command("find", (ctx) => findCommand(ctx, MINI_APP_URL));
bot.command("create", (ctx) => startCreate(ctx));
bot.command("cancel", (ctx) => cancelCommand(ctx));
bot.command("faq", (ctx) => faqCommand(ctx, MINI_APP_URL));
bot.command("stats", (ctx) => statsCommand(ctx));
bot.command("students", (ctx) => studentsCommand(ctx, MINI_APP_URL));
bot.command("schedule", (ctx) => scheduleCommand(ctx, MINI_APP_URL));

// ─── Callback: FAQ ───────────────────────────────
bot.action(/^faq_(.+)$/, async (ctx) => {
  const sectionKey = ctx.match[1];

  if (sectionKey === "back") {
    const section = FAQ_SECTIONS.main;
    try {
      await ctx.editMessage({
        text: section.text,
        format: "html",
        attachments: [section.keyboard(MINI_APP_URL)],
      });
    } catch (_) {}
    return;
  }

  const section = FAQ_SECTIONS[sectionKey];
  if (!section) return;

  const backBtn = Keyboard.inlineKeyboard([
    [Keyboard.button.callback("← Назад к разделам", "faq_back")],
  ]);

  try {
    await ctx.editMessage({
      text: section.text,
      format: "html",
      attachments: [section.keyboard ? section.keyboard(MINI_APP_URL) : backBtn],
    });
  } catch (_) {}
});

// ─── Callback: Create match flow ─────────────────
bot.action(/^cr_(.+)$/, (ctx) => handleCreateCallback(ctx, API_URL, MINI_APP_URL));

// ─── Callback: Join match ────────────────────────
bot.action(/^bot_join_(\d+)$/, async (ctx) => {
  const matchId = parseInt(ctx.match[1]);
  if (isNaN(matchId) || matchId <= 0) return;

  const userId = ctx.user?.user_id;
  try {
    const { botJoinMatch } = require("../server/services/botData");
    const result = await botJoinMatch(userId, matchId);
    if (result.error) {
      await ctx.answerOnCallback({ notification: result.error });
    } else {
      await ctx.answerOnCallback({ notification: "✅ Заявка отправлена!" });
      await ctx.reply(`✅ Вы подали заявку на матч #${matchId}. Создатель матча получит уведомление.`);
    }
  } catch (err) {
    console.error("Bot join error:", err);
    await ctx.answerOnCallback({ notification: "Ошибка. Попробуйте позже." });
  }
});

// ─── Callback: Leave match ───────────────────────
bot.action(/^bot_leave_(\d+)$/, async (ctx) => {
  const matchId = parseInt(ctx.match[1]);
  if (isNaN(matchId) || matchId <= 0) return;

  const userId = ctx.user?.user_id;
  try {
    const { botLeaveMatch } = require("../server/services/botData");
    const result = await botLeaveMatch(userId, matchId);
    if (result.error) {
      await ctx.answerOnCallback({ notification: result.error });
    } else {
      await ctx.answerOnCallback({ notification: "Вы вышли из матча" });
      await ctx.reply(`👋 Вы вышли из матча #${matchId}.`);
    }
  } catch (err) {
    console.error("Bot leave error:", err);
    await ctx.answerOnCallback({ notification: "Ошибка. Попробуйте позже." });
  }
});

// ─── Callback: Score confirmation ────────────────
bot.action(/^confirm_score_(\d+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  const userId = ctx.user?.user_id;
  try {
    const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-confirm/${userId}`, {
      method: "POST",
      headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
    });
    if (res.ok) {
      await ctx.answerOnCallback({ notification: "Счёт подтверждён!" });
      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.link("📱 Открыть Padel GO", MINI_APP_URL)],
      ]);
      await ctx.reply(`✅ Вы подтвердили счёт матча #${matchId}. Рейтинг обновлён!`, {
        format: "html",
        attachments: [keyboard],
      });
    } else {
      const err = await res.json().catch(() => ({}));
      await ctx.answerOnCallback({ notification: err.error || "Ошибка" });
      await ctx.reply(`❌ ${err.error || "Ошибка подтверждения счёта"}`);
    }
  } catch (err) {
    console.error("Bot confirm score error:", err);
    await ctx.answerOnCallback({ notification: "Ошибка соединения с сервером" });
  }
});

// ─── Callback: Score dispute ─────────────────────
bot.action(/^dispute_score_(\d+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  await ctx.answerOnCallback({ notification: "Счёт оспорен." });
  await ctx.reply(`❌ Вы оспорили счёт матча #${matchId}. Свяжитесь с другими участниками для уточнения.`);
});

// ─── Callback: Approve join ──────────────────────
bot.action(/^approve_join_(\d+)_(\d+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  const userId = ctx.match[2];
  try {
    const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-approve/${userId}`, {
      method: "POST",
      headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
    });
    if (res.ok) {
      await ctx.answerOnCallback({ notification: "Игрок принят!" });
      await ctx.reply(`✅ Игрок одобрен и добавлен в матч #${matchId}.`);
    } else {
      const err = await res.json().catch(() => ({}));
      await ctx.answerOnCallback({ notification: err.error || "Ошибка" });
    }
  } catch (err) {
    console.error("Bot approve error:", err);
    await ctx.answerOnCallback({ notification: "Ошибка соединения с сервером" });
  }
});

// ─── Callback: Reject join ───────────────────────
bot.action(/^reject_join_(\d+)_(\d+)$/, async (ctx) => {
  const matchId = ctx.match[1];
  const userId = ctx.match[2];
  try {
    const res = await fetch(`${API_URL}/api/matches/${matchId}/bot-reject/${userId}`, {
      method: "POST",
      headers: { "X-Bot-Token": BOT_TOKEN, "Content-Type": "application/json" },
    });
    if (res.ok) {
      await ctx.answerOnCallback({ notification: "Заявка отклонена" });
      await ctx.reply(`❌ Заявка на матч #${matchId} отклонена.`);
    } else {
      const err = await res.json().catch(() => ({}));
      await ctx.answerOnCallback({ notification: err.error || "Ошибка" });
    }
  } catch (err) {
    console.error("Bot reject error:", err);
    await ctx.answerOnCallback({ notification: "Ошибка соединения с сервером" });
  }
});

// ─── Set bot commands menu ───────────────────────
bot.api.setMyCommands([
  { name: "start", description: "🎾 Запустить Padel GO" },
  { name: "me", description: "👤 Мой профиль" },
  { name: "top", description: "🏆 Таблица лидеров" },
  { name: "matches", description: "📅 Мои матчи" },
  { name: "find", description: "🔍 Найти матч" },
  { name: "create", description: "➕ Создать матч" },
  { name: "cancel", description: "❌ Выйти из матча" },
  { name: "schedule", description: "📅 Расписание тренировок" },
  { name: "students", description: "👨‍🏫 Мои ученики (тренер)" },
  { name: "faq", description: "❓ Частые вопросы" },
  { name: "stats", description: "📊 Статистика (админ)" },
  { name: "help", description: "📋 Помощь" },
]);

// ─── Start bot ───────────────────────────────────
bot.start();
console.log("Padel GO MAX bot started!");

export { bot, BOT_TOKEN, MINI_APP_URL, API_URL };
