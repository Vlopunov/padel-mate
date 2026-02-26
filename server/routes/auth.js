const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { validateTelegramInitData, generateToken } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.post("/telegram", async (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: "initData обязателен" });
    }

    // In development, skip validation
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && !validateTelegramInitData(initData)) {
      return res.status(401).json({ error: "Невалидные данные Telegram" });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) {
      return res.status(400).json({ error: "Данные пользователя отсутствуют" });
    }

    const tgUser = JSON.parse(userRaw);
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
