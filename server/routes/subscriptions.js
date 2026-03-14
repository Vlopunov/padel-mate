const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { PLANS } = require("../config/subscription");

const router = express.Router();

// GET /api/subscriptions/status — check user's subscription
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isPro: true, proExpiresAt: true, isVip: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if expired
    const now = new Date();
    let isPro = user.isPro;
    if (isPro && user.proExpiresAt && user.proExpiresAt < now) {
      // Expired — deactivate
      await prisma.user.update({
        where: { id: req.userId },
        data: { isPro: false, isVip: false },
      });
      // Mark subscription as expired
      await prisma.subscription.updateMany({
        where: { userId: req.userId, status: "active" },
        data: { status: "expired" },
      });
      isPro = false;
    }

    // Get active subscription details
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: "active" },
      orderBy: { expiresAt: "desc" },
    });

    res.json({
      isPro,
      expiresAt: isPro ? user.proExpiresAt : null,
      plan: activeSub?.plan || null,
      plans: Object.values(PLANS).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: p.currency,
        label: p.label,
      })),
    });
  } catch (err) {
    console.error("Subscription status error:", err);
    res.status(500).json({ error: "Error" });
  }
});

// POST /api/subscriptions/create-invoice — create Telegram Stars invoice link
router.post("/create-invoice", authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) return res.status(500).json({ error: "Bot not configured" });

    // Get user's telegramId for the payload
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { telegramId: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Create invoice link via Telegram Bot API
    const payload = JSON.stringify({
      userId: req.userId,
      planId: plan.id,
      telegramId: user.telegramId.toString(),
    });

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: plan.title,
        description: plan.description,
        payload,
        currency: "XTR", // Telegram Stars
        prices: [{ label: plan.label, amount: plan.price }],
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram createInvoiceLink error:", data);
      return res.status(502).json({ error: "Failed to create invoice" });
    }

    res.json({ invoiceLink: data.result });
  } catch (err) {
    console.error("Create invoice error:", err);
    res.status(500).json({ error: "Error creating invoice" });
  }
});

// POST /api/subscriptions/activate — called by bot after successful payment
// Protected by X-Bot-Token header
router.post("/activate", async (req, res) => {
  try {
    const botToken = req.headers["x-bot-token"];
    if (!botToken || botToken !== process.env.BOT_TOKEN) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userId, planId, providerPaymentId, totalAmount } = req.body;
    const plan = PLANS[planId];
    if (!plan || !userId) {
      return res.status(400).json({ error: "Invalid data" });
    }

    const now = new Date();

    // Check if user already has active pro — extend from expiry date
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { isPro: true, proExpiresAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    let startDate = now;
    if (user.isPro && user.proExpiresAt && user.proExpiresAt > now) {
      // Extend from current expiry
      startDate = user.proExpiresAt;
    }

    const expiresAt = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId: parseInt(userId),
        plan: planId,
        status: "active",
        provider: "telegram_stars",
        providerPaymentId: providerPaymentId || null,
        amount: totalAmount || plan.price,
        currency: "XTR",
        startedAt: startDate,
        expiresAt,
      },
    });

    // Activate PRO on user
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        isPro: true,
        isVip: true, // VIP badge comes with PRO
        proExpiresAt: expiresAt,
      },
    });

    res.json({ success: true, expiresAt });
  } catch (err) {
    console.error("Activate subscription error:", err);
    res.status(500).json({ error: "Activation failed" });
  }
});

// GET /api/subscriptions/history — user's subscription history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(subs);
  } catch (err) {
    console.error("Subscription history error:", err);
    res.status(500).json({ error: "Error" });
  }
});

module.exports = router;
