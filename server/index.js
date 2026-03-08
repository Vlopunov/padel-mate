const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const prisma = require("./lib/prisma");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const matchRoutes = require("./routes/matches");
const leaderboardRoutes = require("./routes/leaderboard");
const venueRoutes = require("./routes/venues");
const tournamentRoutes = require("./routes/tournaments");
const achievementRoutes = require("./routes/achievements");
const adminRoutes = require("./routes/admin");
const coachRoutes = require("./routes/coach");
const trainingRoutes = require("./routes/training");
const coachesRoutes = require("./routes/coaches");
const regionsRoutes = require("./routes/regions");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: "Слишком много запросов, подождите" } });
const strictLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { error: "Слишком много запросов, подождите" } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: "Слишком много попыток, подождите 15 минут" } });
app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/coaches", coachesRoutes);
app.use("/api/regions", regionsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: require("./config/app").APP_NAME });
});

// One-time admin setup (protected by ADMIN_SECRET only)
app.post("/api/setup-admin", strictLimiter, async (req, res) => {
  try {
    const { telegramId, secret } = req.body;
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return res.status(500).json({ error: "ADMIN_SECRET не настроен" });
    }
    if (!secret || secret !== adminSecret) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Look up MINSK region for admin default
    const minskRegion = await prisma.region.findUnique({ where: { code: "MINSK" } });
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { isAdmin: true },
      create: {
        telegramId: BigInt(telegramId),
        firstName: "Admin",
        regionId: minskRegion?.id || null,
        isAdmin: true,
        onboarded: false,
      },
    });
    res.json({ ok: true, userId: user.id, isAdmin: user.isAdmin });
  } catch (err) {
    console.error("Setup admin error:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Seed venues (protected by ADMIN_SECRET only)
app.post("/api/seed-venues", strictLimiter, async (req, res) => {
  try {
    const { secret } = req.body;
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return res.status(500).json({ error: "ADMIN_SECRET не настроен" });
    }
    if (!secret || secret !== adminSecret) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Ensure regions exist
    const regionDefs = [
      { code: "MINSK", name: "Минск", country: "BY", timezone: "Europe/Minsk" },
      { code: "BREST", name: "Брест", country: "BY", timezone: "Europe/Minsk" },
      { code: "GRODNO", name: "Гродно", country: "BY", timezone: "Europe/Minsk" },
    ];
    const regionMap = {};
    for (const rd of regionDefs) {
      const r = await prisma.region.upsert({
        where: { code: rd.code },
        update: { name: rd.name, country: rd.country, timezone: rd.timezone },
        create: rd,
      });
      regionMap[rd.code] = r.id;
    }

    const venues = [
      { name: "360 Padel Arena", address: "с/с Боровлянский, д. 308, этаж 2", regionId: regionMap["MINSK"], courts: 7, yclientsCompanyId: "1073853", yclientsFormId: "n1170112", yclientsPriceLabel: "от 120 BYN/час" },
      { name: "Padel Club Minsk", address: "Минск", regionId: regionMap["MINSK"], courts: 2 },
      { name: "Padel Park — Софьи Ковалевской", address: "Минск, ул. Софьи Ковалевской", regionId: regionMap["MINSK"], courts: 1 },
      { name: "Padel Park — Куйбышева", address: "Минск, ул. Куйбышева", regionId: regionMap["MINSK"], courts: 1 },
      { name: "Ilo Club", address: "Минск", regionId: regionMap["MINSK"], courts: 1 },
      { name: "375 Padel Club", address: "Минск", regionId: regionMap["MINSK"], courts: 8 },
      { name: "Meta Padel", address: "Гродно", regionId: regionMap["GRODNO"], courts: 3 },
      { name: "PADEL BAZA", address: "Брест", regionId: regionMap["BREST"], courts: 2 },
    ];
    const results = [];
    for (const v of venues) {
      const existing = await prisma.venue.findFirst({ where: { name: v.name } });
      let venue;
      if (existing) {
        const { name: _n, ...updateData } = v;
        venue = await prisma.venue.update({ where: { id: existing.id }, data: updateData });
      } else {
        venue = await prisma.venue.create({ data: v });
      }
      results.push({ id: venue.id, name: venue.name, courts: venue.courts });
    }
    res.json({ ok: true, venues: results });
  } catch (err) {
    console.error("Seed venues error:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Serve built client (if dist exists)
const clientDist = path.join(__dirname, "../client/dist");

if (fs.existsSync(clientDist)) {
  const indexPath = path.join(clientDist, "index.html");
  app.use(express.static(clientDist));

  const tvPath = path.join(clientDist, "tv.html");
  app.get("/tv/:id", (req, res) => {
    if (fs.existsSync(tvPath)) {
      res.sendFile(tvPath);
    } else {
      res.status(404).send("TV page not found");
    }
  });

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(indexPath);
  });
}

// Error handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`${require("./config/app").APP_NAME} server running on port ${PORT}`);

  // Start bot in the same process (only when NOT running in Docker with separate bot container)
  if (process.env.BOT_TOKEN && process.env.START_BOT !== "false") {
    try {
      require("../bot/index");
    } catch (err) {
      console.error("Bot start error:", err);
    }
  }

  // Start match reminder scheduler
  try {
    const { startReminderScheduler } = require("./services/reminders");
    startReminderScheduler();
  } catch (err) {
    console.error("Reminder scheduler error:", err);
  }
});
