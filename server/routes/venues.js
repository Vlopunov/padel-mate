const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { city } = req.query;
    const where = {};
    if (city) where.city = city;

    const venues = await prisma.venue.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.json(venues);
  } catch (err) {
    console.error("Venues error:", err);
    res.status(500).json({ error: "Ошибка получения площадок" });
  }
});

module.exports = router;
