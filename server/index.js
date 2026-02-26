const express = require("express");
const cors = require("cors");
const path = require("path");

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

// Production: serve built client
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
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
