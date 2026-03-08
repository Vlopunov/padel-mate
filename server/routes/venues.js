const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const yclients = require("../services/yclients");

const router = express.Router();

// List venues
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { regionId } = req.query;
    const where = {};
    if (regionId) where.regionId = parseInt(regionId);

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

// Get single venue
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const venue = await prisma.venue.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!venue) return res.status(404).json({ error: "Площадка не найдена" });
    res.json(venue);
  } catch (err) {
    res.status(500).json({ error: "Ошибка" });
  }
});

// Helper: get venue with YClients check
async function getYcVenue(id) {
  const venue = await prisma.venue.findUnique({ where: { id: parseInt(id) } });
  if (!venue) return { error: "Площадка не найдена", status: 404 };
  if (!venue.yclientsCompanyId || !venue.yclientsFormId) {
    return { error: "Бронирование недоступно", status: 400, venue };
  }
  return { venue };
}

function fallbackUrl(venue) {
  if (!venue?.yclientsFormId || !venue?.yclientsCompanyId) return null;
  return `https://${venue.yclientsFormId}.yclients.com/company/${venue.yclientsCompanyId}/personal/select-time?o=`;
}

// YClients: services
router.get("/:id/booking/services", authMiddleware, async (req, res) => {
  try {
    const { venue, error, status } = await getYcVenue(req.params.id);
    if (error) return res.status(status).json({ error, fallbackUrl: fallbackUrl(venue) });
    const data = await yclients.getServices(venue.yclientsFormId, venue.yclientsCompanyId);
    res.json(data);
  } catch (err) {
    console.error("YClients services error:", err.message);
    const venue = await prisma.venue.findUnique({ where: { id: parseInt(req.params.id) } });
    res.status(502).json({ error: "Ошибка загрузки услуг", fallbackUrl: fallbackUrl(venue) });
  }
});

// YClients: staff (courts)
router.get("/:id/booking/staff", authMiddleware, async (req, res) => {
  try {
    const { venue, error, status } = await getYcVenue(req.params.id);
    if (error) return res.status(status).json({ error, fallbackUrl: fallbackUrl(venue) });
    const serviceIds = req.query.service_ids ? req.query.service_ids.split(',') : [];
    const data = await yclients.getStaff(venue.yclientsFormId, venue.yclientsCompanyId, serviceIds);
    res.json(data);
  } catch (err) {
    console.error("YClients staff error:", err.message);
    const venue = await prisma.venue.findUnique({ where: { id: parseInt(req.params.id) } });
    res.status(502).json({ error: "Ошибка загрузки кортов", fallbackUrl: fallbackUrl(venue) });
  }
});

// YClients: available dates
router.get("/:id/booking/dates", authMiddleware, async (req, res) => {
  try {
    const { venue, error, status } = await getYcVenue(req.params.id);
    if (error) return res.status(status).json({ error, fallbackUrl: fallbackUrl(venue) });
    const { staff_id, service_ids } = req.query;
    const serviceIds = service_ids ? service_ids.split(',') : [];
    const data = await yclients.getDates(venue.yclientsFormId, venue.yclientsCompanyId, staff_id, serviceIds);
    res.json(data);
  } catch (err) {
    console.error("YClients dates error:", err.message);
    const venue = await prisma.venue.findUnique({ where: { id: parseInt(req.params.id) } });
    res.status(502).json({ error: "Ошибка загрузки дат", fallbackUrl: fallbackUrl(venue) });
  }
});

// YClients: available time slots
router.get("/:id/booking/times", authMiddleware, async (req, res) => {
  try {
    const { venue, error, status } = await getYcVenue(req.params.id);
    if (error) return res.status(status).json({ error, fallbackUrl: fallbackUrl(venue) });
    const { staff_id, day, service_ids } = req.query;
    if (!staff_id || !day) return res.status(400).json({ error: "staff_id и day обязательны" });
    const serviceIds = service_ids ? service_ids.split(',') : [];
    const data = await yclients.getTimes(venue.yclientsFormId, venue.yclientsCompanyId, staff_id, day, serviceIds);
    res.json(data);
  } catch (err) {
    console.error("YClients times error:", err.message);
    const venue = await prisma.venue.findUnique({ where: { id: parseInt(req.params.id) } });
    res.status(502).json({ error: "Ошибка загрузки слотов", fallbackUrl: fallbackUrl(venue) });
  }
});

module.exports = router;
