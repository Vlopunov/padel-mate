const express = require("express");
const prisma = require("../lib/prisma");
const { validateTelegramInitData, generateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/telegram", async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: "initData обязателен" });
    }

    // Only skip validation if explicitly opted in via env flag (never in production)
    const skipValidation = process.env.SKIP_TG_VALIDATION === "true" && process.env.NODE_ENV !== "production";
    if (!skipValidation && !validateTelegramInitData(initData)) {
      return res.status(401).json({ error: "Невалидные данные Telegram" });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) {
      return res.status(400).json({ error: "Данные пользователя отсутствуют" });
    }

    let tgUser;
    try {
      tgUser = JSON.parse(userRaw);
    } catch (e) {
      return res.status(400).json({ error: "Невалидные данные пользователя" });
    }
    if (!tgUser || !tgUser.id) {
      return res.status(400).json({ error: "ID пользователя отсутствует" });
    }
    const telegramId = BigInt(tgUser.id);

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    const isNew = !user;

    if (isNew) {
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: tgUser.first_name || "User",
          lastName: tgUser.last_name || null,
          username: tgUser.username || null,
          photoUrl: tgUser.photo_url || null,
          city: "MINSK",
        },
      });

      // Notify admins about new registration (fire-and-forget)
      try {
        const { sendTelegramMessage } = require("../services/notifications");
        const { CITY_MAP } = require("../config/app");
        const admins = await prisma.user.findMany({
          where: { isAdmin: true },
          select: { telegramId: true },
        });
        const cityName = CITY_MAP[user.city] || user.city;
        const nameStr = `${user.firstName}${user.lastName ? " " + user.lastName : ""}`;
        const usernameStr = user.username ? ` (@${user.username})` : "";
        const total = await prisma.user.count();
        const msg = `🆕 Новый игрок: <b>${nameStr}</b>${usernameStr}\n🏙️ ${cityName}\n👥 Всего игроков: <b>${total}</b>`;
        for (const admin of admins) {
          sendTelegramMessage(admin.telegramId.toString(), msg).catch(() => {});
        }
      } catch (notifyErr) {
        console.error("New user notify error:", notifyErr.message);
      }
    } else {
      user = await prisma.user.update({
        where: { telegramId },
        data: {
          firstName: tgUser.first_name || user.firstName,
          lastName: tgUser.last_name,
          username: tgUser.username,
          photoUrl: tgUser.photo_url || user.photoUrl,
        },
      });
    }

    const token = generateToken(user);

    // Serialize BigInt
    const safeUser = { ...user, telegramId: user.telegramId.toString() };

    res.json({
      token,
      user: safeUser,
      isNew,
      needsOnboarding: !user.onboarded,
    });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Ошибка авторизации" });
  }
});

module.exports = router;
