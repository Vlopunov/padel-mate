const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const matchRoutes = require("./routes/matches");
const leaderboardRoutes = require("./routes/leaderboard");
const venueRoutes = require("./routes/venues");
const tournamentRoutes = require("./routes/tournaments");
const achievementRoutes = require("./routes/achievements");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: require("./config/app").APP_NAME });
});

// One-time admin setup (protected by BOT_TOKEN)
app.post("/api/setup-admin", async (req, res) => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const { telegramId, secret } = req.body;
    if (!secret || secret !== process.env.BOT_TOKEN) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { isAdmin: true },
      create: {
        telegramId: BigInt(telegramId),
        firstName: "Admin",
        city: "MINSK",
        isAdmin: true,
        onboarded: false,
      },
    });
    res.json({ ok: true, userId: user.id, isAdmin: user.isAdmin });
  } catch (err) {
    console.error("Setup admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Seed venues (protected by BOT_TOKEN)
app.post("/api/seed-venues", async (req, res) => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const { secret } = req.body;
    if (!secret || secret !== process.env.BOT_TOKEN) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const venues = [
      { name: "360 Padel Arena", address: "Минск", city: "MINSK", courts: 7 },
      { name: "Padel Club Minsk", address: "Минск", city: "MINSK", courts: 2 },
      { name: "Padel Park — Софьи Ковалевской", address: "Минск, ул. Софьи Ковалевской", city: "MINSK", courts: 1 },
      { name: "Padel Park — Куйбышева", address: "Минск, ул. Куйбышева", city: "MINSK", courts: 1 },
      { name: "Ilo Club", address: "Минск", city: "MINSK", courts: 1 },
      { name: "375 Padel Club", address: "Минск", city: "MINSK", courts: 8 },
    ];
    const results = [];
    for (const v of venues) {
      const venue = await prisma.venue.upsert({
        where: { id: (await prisma.venue.findFirst({ where: { name: v.name } }))?.id || 0 },
        update: { courts: v.courts },
        create: v,
      });
      results.push({ id: venue.id, name: venue.name, courts: venue.courts });
    }
    res.json({ ok: true, venues: results });
  } catch (err) {
    console.error("Seed venues error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve built client (if dist exists)
const clientDist = path.join(__dirname, "../client/dist");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Client dist path:", clientDist);
console.log("Client dist exists:", fs.existsSync(clientDist));

if (fs.existsSync(clientDist)) {
  const indexPath = path.join(clientDist, "index.html");
  console.log("index.html exists:", fs.existsSync(indexPath));

  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(indexPath);
  });
  console.log("Static file serving enabled");
} else {
  console.log("No client dist found — static serving disabled");
}

// Error handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`${require("./config/app").APP_NAME} server running on port ${PORT}`);

  // Start bot in the same process (production)
  if (process.env.BOT_TOKEN) {
    try {
      require("../bot/index");
    } catch (err) {
      console.error("Bot start error:", err);
    }
  }
});
