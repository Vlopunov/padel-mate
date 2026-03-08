const express = require("express");
const prisma = require("../lib/prisma");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, name: true, country: true, timezone: true },
    });
    res.json(regions);
  } catch (err) {
    console.error("Regions error:", err);
    res.status(500).json({ error: "Ошибка получения регионов" });
  }
});

module.exports = router;
