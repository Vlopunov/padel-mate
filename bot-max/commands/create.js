import { Keyboard } from "@maxhub/max-bot-api";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { LEVELS } = require("../../server/config/app");

function getTimezoneOffset(tz) {
  const now = new Date();
  const utcStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = now.toLocaleString("en-US", { timeZone: tz });
  const diffMs = new Date(tzStr) - new Date(utcStr);
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.abs(Math.floor((diffMs % 3600000) / 60000));
  return `${hours >= 0 ? "+" : "-"}${String(Math.abs(hours)).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

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

export async function startCreate(ctx) {
  const userId = ctx.user?.user_id;

  try {
    const { getAllCountriesWithRegions } = require("../../server/services/botData");
    const countries = await getAllCountriesWithRegions();

    if (countries.length === 0) {
      await ctx.reply("⚠️ Нет доступных площадок. Обратитесь к администратору.");
      return;
    }

    createState.set(userId, { step: "country", timestamp: Date.now(), data: {}, countries });

    const buttons = countries.map((c) => [
      Keyboard.button.callback(`${c.flag} ${c.name}`, `cr_country_${c.id}`),
    ]);

    const keyboard = Keyboard.inlineKeyboard(buttons);
    await ctx.reply("🎾 <b>Создание матча</b>\n\n🌍 Выберите страну:", {
      format: "html",
      attachments: [keyboard],
    });
  } catch (err) {
    console.error("Create command start error:", err);
    await ctx.reply("❌ Ошибка. Попробуйте позже.");
  }
}

export async function handleCreateCallback(ctx, apiUrl, miniAppUrl) {
  const userId = ctx.user?.user_id;
  const data = ctx.callback?.payload;

  if (!data) return;

  try {
    const { getVenuesByRegion, getAllCountriesWithRegions, botCreateMatch } = require("../../server/services/botData");

    let state = createState.get(userId);
    if (!state) {
      await ctx.answerOnCallback({ notification: "Сессия истекла. Начните /create заново." });
      return;
    }

    // ── Step 0: Country selected → show regions or auto-select ──
    if (data.startsWith("cr_country_")) {
      const countryId = parseInt(data.replace("cr_country_", ""));
      const countries = state.countries || await getAllCountriesWithRegions();
      const country = countries.find((c) => c.id === countryId);

      if (!country || country.regions.length === 0) {
        await ctx.answerOnCallback({ notification: "Нет площадок в этой стране" });
        return;
      }

      state.data.countryName = country.name;
      state.data.countryFlag = country.flag;
      state.timestamp = Date.now();

      if (country.regions.length === 1) {
        const region = country.regions[0];
        state.data.regionId = region.id;
        state.data.regionName = region.name;
        state.data.timezone = region.timezone;
        state.step = "venue";

        const venues = await getVenuesByRegion(region.id);
        if (venues.length === 0) {
          await ctx.answerOnCallback({ notification: "Нет площадок в этом регионе" });
          return;
        }

        const buttons = venues.map((v) => [
          Keyboard.button.callback(v.name, `cr_ven_${v.id}`),
        ]);

        await ctx.editMessage({
          text: "🎾 <b>Создание матча</b>\n\n📍 Выберите площадку:",
          format: "html",
          attachments: [Keyboard.inlineKeyboard(buttons)],
        });
        return;
      }

      state.step = "region";
      state.countryRegions = country.regions;

      const buttons = country.regions.map((r) => [
        Keyboard.button.callback(`${r.name} (${r.count} площ.)`, `cr_reg_${r.id}`),
      ]);

      await ctx.editMessage({
        text: `🎾 <b>Создание матча</b>\n\n${country.flag} ${country.name}\n🏙️ Выберите регион:`,
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Step 1: Region selected → show venues ──
    if (data.startsWith("cr_reg_")) {
      const regionId = parseInt(data.replace("cr_reg_", ""));
      state.data.regionId = regionId;
      state.step = "venue";
      state.timestamp = Date.now();

      const regions = state.countryRegions || (await getAllCountriesWithRegions()).flatMap((c) => c.regions);
      const region = regions.find(r => r.id === regionId);
      state.data.timezone = region?.timezone || "Europe/Minsk";
      state.data.regionName = region?.name || "—";

      const venues = await getVenuesByRegion(regionId);
      if (venues.length === 0) {
        await ctx.answerOnCallback({ notification: "Нет площадок в этом регионе" });
        return;
      }

      const buttons = venues.map((v) => [
        Keyboard.button.callback(v.name, `cr_ven_${v.id}`),
      ]);

      await ctx.editMessage({
        text: "🎾 <b>Создание матча</b>\n\n📍 Выберите площадку:",
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
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
        buttons.push([Keyboard.button.callback(label, `cr_day_${i}`)]);
      }

      await ctx.editMessage({
        text: "🎾 <b>Создание матча</b>\n\n📅 Выберите день:",
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Step 3: Date selected → show times ──
    if (data.startsWith("cr_day_")) {
      const dayOffset = parseInt(data.replace("cr_day_", ""));
      const tz = state.data.timezone || "Europe/Minsk";
      const nowInTz = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
      const tzDate = new Date(nowInTz);
      tzDate.setDate(tzDate.getDate() + dayOffset);
      state.data.dateStr = tzDate.toISOString().split("T")[0];
      state.data.timezone = tz;
      state.step = "time";
      state.timestamp = Date.now();

      const slots = [];
      const tzHour = nowInTz.getHours();
      const tzMinute = nowInTz.getMinutes();
      for (let h = 8; h <= 22; h++) {
        for (const m of [0, 30]) {
          if (dayOffset === 0) {
            if (h < tzHour || (h === tzHour && m <= tzMinute)) continue;
          }
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          slots.push(timeStr);
        }
      }

      if (slots.length === 0) {
        await ctx.editMessage({
          text: "⚠️ На сегодня нет доступных слотов. Выберите другой день через /create",
        });
        createState.delete(userId);
        return;
      }

      // Group into rows of 4 (MAX supports up to 7 per row)
      const buttons = [];
      for (let i = 0; i < slots.length; i += 4) {
        const row = slots.slice(i, i + 4).map((t) =>
          Keyboard.button.callback(t, `cr_hr_${t}`)
        );
        buttons.push(row);
      }

      await ctx.editMessage({
        text: "🎾 <b>Создание матча</b>\n\n⏰ Выберите время:",
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Step 4: Time selected → show durations ──
    if (data.startsWith("cr_hr_")) {
      const time = data.replace("cr_hr_", "");
      state.data.time = time;
      state.step = "duration";
      state.timestamp = Date.now();

      const buttons = [[
        Keyboard.button.callback("60 мин", "cr_dur_60"),
        Keyboard.button.callback("90 мин", "cr_dur_90"),
        Keyboard.button.callback("120 мин", "cr_dur_120"),
      ]];

      await ctx.editMessage({
        text: "🎾 <b>Создание матча</b>\n\n⏱ Выберите длительность:",
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Step 5: Duration selected → show levels ──
    if (data.startsWith("cr_dur_")) {
      const dur = parseInt(data.replace("cr_dur_", ""));
      state.data.durationMin = dur;
      state.step = "level";
      state.timestamp = Date.now();

      const buttons = [
        [Keyboard.button.callback("🔰 Все уровни (D–A)", "cr_lvl_1.0_4.0")],
        [Keyboard.button.callback("D — Новичок", "cr_lvl_1.0_1.0")],
        [Keyboard.button.callback("C — Любитель", "cr_lvl_2.0_2.0")],
        [Keyboard.button.callback("B — Продвинутый", "cr_lvl_3.0_3.0")],
        [Keyboard.button.callback("A — Сильный", "cr_lvl_4.0_4.0")],
        [Keyboard.button.callback("C–B (Любитель–Продвинутый)", "cr_lvl_2.0_3.0")],
      ];

      await ctx.editMessage({
        text: "🎾 <b>Создание матча</b>\n\n📊 Выберите уровень:",
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Step 6: Level selected → confirm ──
    if (data.startsWith("cr_lvl_")) {
      const parts = data.replace("cr_lvl_", "").split("_");
      state.data.levelMin = parseFloat(parts[0]);
      state.data.levelMax = parseFloat(parts[1]);
      state.step = "confirm";
      state.timestamp = Date.now();

      const countryFlag = state.data.countryFlag || "";
      const cityName = (countryFlag ? countryFlag + " " : "") + (state.data.regionName || "—");
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

      const buttons = [[
        Keyboard.button.callback("✅ Создать", "cr_ok"),
        Keyboard.button.callback("❌ Отмена", "cr_no"),
      ]];

      await ctx.editMessage({
        text,
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Step 7: Confirm ──
    if (data === "cr_ok") {
      const s = state.data;
      const tzOffset = getTimezoneOffset(s.timezone || "Europe/Minsk");
      const fullDate = `${s.dateStr}T${s.time}:00${tzOffset}`;

      const result = await botCreateMatch(userId, {
        venueId: s.venueId,
        date: fullDate,
        durationMin: s.durationMin,
        levelMin: s.levelMin,
        levelMax: s.levelMax,
      });

      createState.delete(userId);

      if (result.error) {
        await ctx.editMessage({ text: `❌ ${result.error}` });
        return;
      }

      const match = result.match;
      const dateStr = new Date(match.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      const timeStr = new Date(match.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

      const buttons = [
        [Keyboard.button.link("📱 Открыть матч", `${miniAppUrl}?match=${match.id}`)],
      ];

      await ctx.editMessage({
        text:
          `✅ <b>Матч создан!</b>\n\n` +
          `📍 ${match.venue?.name || "—"}\n` +
          `📅 ${dateStr}, ${timeStr}\n` +
          `⏱ ${match.durationMin} мин\n\n` +
          `Поделитесь ссылкой, чтобы пригласить друзей!`,
        format: "html",
        attachments: [Keyboard.inlineKeyboard(buttons)],
      });
      return;
    }

    // ── Cancel ──
    if (data === "cr_no") {
      createState.delete(userId);
      await ctx.editMessage({ text: "❌ Создание матча отменено." });
      return;
    }
  } catch (err) {
    console.error("Create callback error:", err);
    await ctx.answerOnCallback({ notification: "Ошибка. Попробуйте /create заново." });
    createState.delete(userId);
  }
}
