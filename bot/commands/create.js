const { CITY_MAP, LEVELS } = require("../../server/config/app");

// In-memory state for multi-step create conversation
const createState = new Map();

// Cleanup stale states older than 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of createState) {
    if (now - state.timestamp > 60 * 60 * 1000) {
      createState.delete(key);
    }
  }
}, 5 * 60 * 1000);

async function startCreate(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const { getAllCitiesWithVenues } = require("../../server/services/botData");
    const cities = await getAllCitiesWithVenues();

    if (cities.length === 0) {
      await bot.sendMessage(chatId, "⚠️ Нет доступных площадок. Обратитесь к администратору.");
      return;
    }

    // Reset any existing state
    createState.set(telegramId, { step: "city", timestamp: Date.now(), data: {} });

    const buttons = cities.map((c) => [
      { text: `${c.name} (${c.count} площ.)`, callback_data: `cr_city_${c.city}` },
    ]);

    await bot.sendMessage(chatId, "🎾 <b>Создание матча</b>\n\n🏙️ Выберите город:", {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    });
  } catch (err) {
    console.error("Create command start error:", err);
    await bot.sendMessage(chatId, "❌ Ошибка. Попробуйте позже.");
  }
}

async function handleCreateCallback(bot, query) {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const data = query.data;

  try {
    const { getVenuesByCity, botCreateMatch, getLevelInfo } = require("../../server/services/botData");

    let state = createState.get(telegramId);
    if (!state) {
      await bot.answerCallbackQuery(query.id, { text: "Сессия истекла. Начните /create заново." });
      return;
    }

    // ── Step 1: City selected → show venues ──
    if (data.startsWith("cr_city_")) {
      const city = data.replace("cr_city_", "");
      state.data.city = city;
      state.step = "venue";
      state.timestamp = Date.now();

      const venues = await getVenuesByCity(city);
      if (venues.length === 0) {
        await bot.answerCallbackQuery(query.id, { text: "Нет площадок в этом городе" });
        return;
      }

      const buttons = venues.map((v) => [
        { text: v.name, callback_data: `cr_ven_${v.id}` },
      ]);

      await bot.editMessageText("🎾 <b>Создание матча</b>\n\n📍 Выберите площадку:", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // ── Step 2: Venue selected → show dates ──
    if (data.startsWith("cr_ven_")) {
      const venueId = parseInt(data.replace("cr_ven_", ""));
      state.data.venueId = venueId;
      state.step = "date";
      state.timestamp = Date.now();

      const today = new Date();
      const buttons = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" :
          d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" });
        buttons.push([{ text: label, callback_data: `cr_day_${i}` }]);
      }

      await bot.editMessageText("🎾 <b>Создание матча</b>\n\n📅 Выберите день:", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // ── Step 3: Date selected → show times ──
    if (data.startsWith("cr_day_")) {
      const dayOffset = parseInt(data.replace("cr_day_", ""));
      // Calculate date in Minsk timezone (UTC+3)
      const MINSK_OFFSET = 3 * 60 * 60 * 1000;
      const nowUtc = new Date();
      const minskNow = new Date(nowUtc.getTime() + MINSK_OFFSET);
      const minskDate = new Date(minskNow);
      minskDate.setDate(minskDate.getDate() + dayOffset);
      state.data.dateStr = minskDate.toISOString().split("T")[0];
      state.step = "time";
      state.timestamp = Date.now();

      // Generate time slots from 8:00 to 22:00 (Minsk time)
      const slots = [];
      const minskHour = minskNow.getUTCHours();
      const minskMinute = minskNow.getUTCMinutes();
      for (let h = 8; h <= 22; h++) {
        for (const m of [0, 30]) {
          // Skip past times if today (compare in Minsk time)
          if (dayOffset === 0) {
            if (h < minskHour || (h === minskHour && m <= minskMinute)) continue;
          }
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          slots.push(timeStr);
        }
      }

      if (slots.length === 0) {
        await bot.editMessageText("⚠️ На сегодня нет доступных слотов. Выберите другой день через /create", {
          chat_id: chatId,
          message_id: query.message.message_id,
        });
        await bot.answerCallbackQuery(query.id);
        createState.delete(telegramId);
        return;
      }

      // Group into rows of 4
      const buttons = [];
      for (let i = 0; i < slots.length; i += 4) {
        const row = slots.slice(i, i + 4).map((t) => ({
          text: t,
          callback_data: `cr_hr_${t}`,
        }));
        buttons.push(row);
      }

      await bot.editMessageText("🎾 <b>Создание матча</b>\n\n⏰ Выберите время:", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // ── Step 4: Time selected → show durations ──
    if (data.startsWith("cr_hr_")) {
      const time = data.replace("cr_hr_", "");
      state.data.time = time;
      state.step = "duration";
      state.timestamp = Date.now();

      const buttons = [
        [
          { text: "60 мин", callback_data: "cr_dur_60" },
          { text: "90 мин", callback_data: "cr_dur_90" },
          { text: "120 мин", callback_data: "cr_dur_120" },
        ],
      ];

      await bot.editMessageText("🎾 <b>Создание матча</b>\n\n⏱ Выберите длительность:", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // ── Step 5: Duration selected → show levels ──
    if (data.startsWith("cr_dur_")) {
      const dur = parseInt(data.replace("cr_dur_", ""));
      state.data.durationMin = dur;
      state.step = "level";
      state.timestamp = Date.now();

      const buttons = [
        [{ text: "🔰 Все уровни (D–A)", callback_data: "cr_lvl_1.0_4.0" }],
        [{ text: "D — Новичок", callback_data: "cr_lvl_1.0_1.0" }],
        [{ text: "C — Любитель", callback_data: "cr_lvl_2.0_2.0" }],
        [{ text: "B — Продвинутый", callback_data: "cr_lvl_3.0_3.0" }],
        [{ text: "A — Сильный", callback_data: "cr_lvl_4.0_4.0" }],
        [{ text: "C–B (Любитель–Продвинутый)", callback_data: "cr_lvl_2.0_3.0" }],
      ];

      await bot.editMessageText("🎾 <b>Создание матча</b>\n\n📊 Выберите уровень:", {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: buttons },
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // ── Step 6: Level selected → confirm ──
    if (data.startsWith("cr_lvl_")) {
      const parts = data.replace("cr_lvl_", "").split("_");
      state.data.levelMin = parseFloat(parts[0]);
      state.data.levelMax = parseFloat(parts[1]);
      state.step = "confirm";
      state.timestamp = Date.now();

      const cityName = CITY_MAP[state.data.city] || state.data.city;
      const levelNames = LEVELS.filter(
        (l) => l.level >= state.data.levelMin && l.level <= state.data.levelMax
      );
      const levelStr = levelNames.map((l) => `${l.category}`).join("–") || "Все";

      let text = `🎾 <b>Подтверждение матча</b>\n\n`;
      text += `🏙️ ${cityName}\n`;
      text += `📅 ${state.data.dateStr} в ${state.data.time}\n`;
      text += `⏱ ${state.data.durationMin} мин\n`;
      text += `📊 Уровень: ${levelStr}\n\n`;
      text += `Создать матч?`;

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Создать", callback_data: "cr_ok" },
              { text: "❌ Отмена", callback_data: "cr_no" },
            ],
          ],
        },
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }

    // ── Step 7: Confirm ──
    if (data === "cr_ok") {
      const s = state.data;
      // Minsk is UTC+3, user selects time in Minsk timezone
      const fullDate = `${s.dateStr}T${s.time}:00+03:00`;

      const result = await botCreateMatch(telegramId, {
        venueId: s.venueId,
        date: fullDate,
        durationMin: s.durationMin,
        levelMin: s.levelMin,
        levelMax: s.levelMax,
      });

      createState.delete(telegramId);

      if (result.error) {
        await bot.editMessageText(`❌ ${result.error}`, {
          chat_id: chatId,
          message_id: query.message.message_id,
        });
        await bot.answerCallbackQuery(query.id);
        return;
      }

      const match = result.match;
      const dateStr = new Date(match.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      const timeStr = new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      await bot.editMessageText(
        `✅ <b>Матч создан!</b>\n\n` +
        `📍 ${match.venue?.name || "—"}\n` +
        `📅 ${dateStr}, ${timeStr}\n` +
        `⏱ ${match.durationMin} мин\n\n` +
        `Поделитесь ссылкой, чтобы пригласить друзей:`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📱 Открыть матч", web_app: { url: `${process.env.MINI_APP_URL || "https://your-domain.com"}?match=${match.id}` } }],
              [{ text: "📤 Поделиться", switch_inline_query: `match_${match.id}` }],
            ],
          },
        }
      );
      await bot.answerCallbackQuery(query.id, { text: "Матч создан!" });
      return;
    }

    // ── Cancel ──
    if (data === "cr_no") {
      createState.delete(telegramId);
      await bot.editMessageText("❌ Создание матча отменено.", {
        chat_id: chatId,
        message_id: query.message.message_id,
      });
      await bot.answerCallbackQuery(query.id);
      return;
    }
  } catch (err) {
    console.error("Create callback error:", err);
    await bot.answerCallbackQuery(query.id, { text: "Ошибка. Попробуйте /create заново." });
    createState.delete(telegramId);
  }
}

module.exports = { startCreate, handleCreateCallback };
