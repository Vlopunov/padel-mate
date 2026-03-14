const express = require("express");
const prisma = require("../lib/prisma");
const { authMiddleware } = require("../middleware/auth");
const { PLANS, PROVIDERS } = require("../config/subscription");

const router = express.Router();

// ─── Helper: activate subscription on user ───────────
async function activateSubscription({ userId, planId, provider, providerPaymentId, amount, currency }) {
  const plan = PLANS[planId];
  if (!plan) throw new Error("Invalid plan");

  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: { isPro: true, proExpiresAt: true },
  });
  if (!user) throw new Error("User not found");

  // Extend from current expiry if still active
  let startDate = now;
  if (user.isPro && user.proExpiresAt && user.proExpiresAt > now) {
    startDate = user.proExpiresAt;
  }

  const expiresAt = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await prisma.subscription.create({
    data: {
      userId: parseInt(userId),
      plan: planId,
      status: "active",
      provider,
      providerPaymentId: providerPaymentId || null,
      amount: amount || 0,
      currency: currency || "XTR",
      startedAt: startDate,
      expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      isPro: true,
      isVip: true,
      proExpiresAt: expiresAt,
    },
  });

  return { expiresAt };
}

// ─── GET /status ─────────────────────────────────────
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isPro: true, proExpiresAt: true, isVip: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    let isPro = user.isPro;
    if (isPro && user.proExpiresAt && user.proExpiresAt < now) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { isPro: false, isVip: false },
      });
      await prisma.subscription.updateMany({
        where: { userId: req.userId, status: "active" },
        data: { status: "expired" },
      });
      isPro = false;
    }

    const activeSub = await prisma.subscription.findFirst({
      where: { userId: req.userId, status: "active" },
      orderBy: { expiresAt: "desc" },
    });

    // Build plans with all provider prices
    const plans = Object.values(PLANS).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      label: p.label,
      durationDays: p.durationDays,
      prices: p.prices,
    }));

    // Available providers
    const providers = Object.values(PROVIDERS).filter(p => p.available);

    res.json({
      isPro,
      expiresAt: isPro ? user.proExpiresAt : null,
      plan: activeSub?.plan || null,
      plans,
      providers,
    });
  } catch (err) {
    console.error("Subscription status error:", err);
    res.status(500).json({ error: "Error" });
  }
});

// ─── POST /create-invoice ─────────────────────────────
router.post("/create-invoice", authMiddleware, async (req, res) => {
  try {
    const { planId, provider } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const providerKey = provider || "stars";
    const priceInfo = plan.prices[providerKey];
    if (!priceInfo) return res.status(400).json({ error: "Invalid provider" });

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { telegramId: true, firstName: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const payload = JSON.stringify({
      userId: req.userId,
      planId: plan.id,
      provider: providerKey,
      telegramId: user.telegramId.toString(),
    });

    // ── Telegram Stars ──
    if (providerKey === "stars") {
      const BOT_TOKEN = process.env.BOT_TOKEN;
      if (!BOT_TOKEN) return res.status(500).json({ error: "Bot not configured" });

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: plan.title,
          description: plan.description,
          payload,
          currency: "XTR",
          prices: [{ label: plan.label, amount: priceInfo.amount }],
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        console.error("Telegram createInvoiceLink error:", data);
        return res.status(502).json({ error: "Failed to create invoice" });
      }

      return res.json({ type: "invoice", invoiceLink: data.result });
    }

    // ── YooKassa (Russian cards) ──
    if (providerKey === "yookassa") {
      const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
      const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
      if (!SHOP_ID || !SECRET_KEY) return res.status(500).json({ error: "YooKassa not configured" });

      const MINI_APP_URL = process.env.MINI_APP_URL || "https://padel-mate-production.up.railway.app";
      const amountRub = (priceInfo.amount / 100).toFixed(2);

      const idempotencyKey = `${req.userId}_${planId}_${Date.now()}`;
      const response = await fetch("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64"),
          "Idempotence-Key": idempotencyKey,
        },
        body: JSON.stringify({
          amount: { value: amountRub, currency: "RUB" },
          capture: true,
          confirmation: {
            type: "redirect",
            return_url: `${MINI_APP_URL}?payment=success`,
          },
          description: plan.title,
          metadata: { userId: req.userId, planId: plan.id, provider: "yookassa" },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("YooKassa error:", data);
        return res.status(502).json({ error: "Failed to create payment" });
      }

      return res.json({
        type: "redirect",
        paymentUrl: data.confirmation.confirmation_url,
        paymentId: data.id,
      });
    }

    // ── bePaid (Visa/MC non-Russian) ──
    if (providerKey === "bepaid") {
      const SHOP_ID = process.env.BEPAID_SHOP_ID;
      const SECRET_KEY = process.env.BEPAID_SECRET_KEY;
      if (!SHOP_ID || !SECRET_KEY) return res.status(500).json({ error: "bePaid not configured" });

      const MINI_APP_URL = process.env.MINI_APP_URL || "https://padel-mate-production.up.railway.app";

      const response = await fetch("https://checkout.bepaid.by/ctp/api/checkouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64"),
        },
        body: JSON.stringify({
          checkout: {
            test: process.env.NODE_ENV !== "production",
            transaction_type: "payment",
            attempts: 3,
            settings: {
              success_url: `${MINI_APP_URL}?payment=success`,
              decline_url: `${MINI_APP_URL}?payment=failed`,
              fail_url: `${MINI_APP_URL}?payment=failed`,
              notification_url: `${MINI_APP_URL.replace(/\/$/, "")}/api/subscriptions/webhook/bepaid`,
              language: "ru",
              customer_fields: { hidden: ["email"] },
            },
            order: {
              amount: priceInfo.amount,
              currency: priceInfo.currency,
              description: plan.title,
              tracking_id: `${req.userId}:${planId}:${Date.now()}`,
            },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.checkout?.redirect_url) {
        console.error("bePaid error:", data);
        return res.status(502).json({ error: "Failed to create payment" });
      }

      return res.json({
        type: "redirect",
        paymentUrl: data.checkout.redirect_url,
        paymentId: data.checkout.token,
      });
    }

    // ── Crypto (@send) ──
    if (providerKey === "crypto") {
      // Crypto via @send — use Telegram Stars invoice with XTR,
      // OR generate a manual payment link. For now, create a Stars invoice
      // since @send supports Telegram payments natively.
      // Alternative: show instructions to send USDT to a wallet.
      const BOT_TOKEN = process.env.BOT_TOKEN;
      if (!BOT_TOKEN) return res.status(500).json({ error: "Bot not configured" });

      // Use Telegram's built-in crypto payment (provider_token for CryptoBot/send)
      const CRYPTO_PROVIDER_TOKEN = process.env.CRYPTO_PROVIDER_TOKEN;

      if (CRYPTO_PROVIDER_TOKEN) {
        // CryptoBot / @send provider
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: plan.title,
            description: plan.description,
            payload,
            provider_token: CRYPTO_PROVIDER_TOKEN,
            currency: "USD",
            prices: [{ label: plan.label, amount: priceInfo.amount }],
          }),
        });

        const data = await response.json();
        if (!data.ok) {
          console.error("Crypto invoice error:", data);
          return res.status(502).json({ error: "Failed to create crypto invoice" });
        }

        return res.json({ type: "invoice", invoiceLink: data.result });
      }

      // Fallback: manual crypto — return wallet address + amount
      return res.json({
        type: "manual_crypto",
        amount: (priceInfo.amount / 100).toFixed(2),
        currency: "USDT",
        instructions: "Send USDT (TRC-20) to the address below, then tap Confirm.",
        wallet: process.env.CRYPTO_WALLET || "TBD",
        userId: req.userId,
        planId: plan.id,
      });
    }

    return res.status(400).json({ error: "Unknown provider" });
  } catch (err) {
    console.error("Create invoice error:", err);
    res.status(500).json({ error: "Error creating invoice" });
  }
});

// ─── POST /activate — called by bot after Stars payment ──
router.post("/activate", async (req, res) => {
  try {
    const botToken = req.headers["x-bot-token"];
    if (!botToken || botToken !== process.env.BOT_TOKEN) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userId, planId, providerPaymentId, totalAmount } = req.body;
    const plan = PLANS[planId];
    if (!plan || !userId) return res.status(400).json({ error: "Invalid data" });

    const priceInfo = plan.prices.stars;
    const result = await activateSubscription({
      userId,
      planId,
      provider: "telegram_stars",
      providerPaymentId,
      amount: totalAmount || priceInfo.amount,
      currency: "XTR",
    });

    res.json({ success: true, expiresAt: result.expiresAt });
  } catch (err) {
    console.error("Activate subscription error:", err);
    res.status(500).json({ error: "Activation failed" });
  }
});

// ─── POST /webhook/yookassa — YooKassa webhook ──────────
router.post("/webhook/yookassa", express.json(), async (req, res) => {
  try {
    const event = req.body;
    if (event.event !== "payment.succeeded") {
      return res.json({ ok: true });
    }

    const payment = event.object;
    const metadata = payment.metadata;
    if (!metadata?.userId || !metadata?.planId) {
      console.error("YooKassa webhook: missing metadata", payment.id);
      return res.json({ ok: true });
    }

    const plan = PLANS[metadata.planId];
    if (!plan) return res.json({ ok: true });

    const priceInfo = plan.prices.yookassa;
    await activateSubscription({
      userId: metadata.userId,
      planId: metadata.planId,
      provider: "yookassa",
      providerPaymentId: payment.id,
      amount: priceInfo.amount,
      currency: "RUB",
    });

    // Notify user via bot
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(metadata.userId) },
        select: { telegramId: true },
      });
      if (user && process.env.BOT_TOKEN) {
        const { sendTelegramMessage } = require("../services/notifications");
        await sendTelegramMessage(
          user.telegramId.toString(),
          `\u2B50 <b>Padel GO PRO \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D!</b>\n\n\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u043E\u043F\u043B\u0430\u0442\u0443! \u0412\u0441\u0435 PRO-\u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B.`
        );
      }
    } catch (_) {}

    res.json({ ok: true });
  } catch (err) {
    console.error("YooKassa webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

// ─── POST /webhook/bepaid — bePaid webhook ──────────────
router.post("/webhook/bepaid", express.json(), async (req, res) => {
  try {
    const data = req.body;
    const tx = data.transaction;

    if (!tx || tx.status !== "successful") {
      return res.json({ ok: true });
    }

    const trackingId = tx.tracking_id; // "userId:planId:timestamp"
    if (!trackingId) return res.json({ ok: true });

    const [userIdStr, planId] = trackingId.split(":");
    const userId = parseInt(userIdStr);
    if (!userId || !planId) return res.json({ ok: true });

    const plan = PLANS[planId];
    if (!plan) return res.json({ ok: true });

    const priceInfo = plan.prices.bepaid;
    await activateSubscription({
      userId,
      planId,
      provider: "bepaid",
      providerPaymentId: tx.uid || tx.id,
      amount: priceInfo.amount,
      currency: "BYN",
    });

    // Notify user
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      });
      if (user && process.env.BOT_TOKEN) {
        const { sendTelegramMessage } = require("../services/notifications");
        await sendTelegramMessage(
          user.telegramId.toString(),
          `\u2B50 <b>Padel GO PRO \u0430\u043A\u0442\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D!</b>\n\n\u0421\u043F\u0430\u0441\u0438\u0431\u043E \u0437\u0430 \u043E\u043F\u043B\u0430\u0442\u0443! \u0412\u0441\u0435 PRO-\u0444\u0443\u043D\u043A\u0446\u0438\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B.`
        );
      }
    } catch (_) {}

    res.json({ ok: true });
  } catch (err) {
    console.error("bePaid webhook error:", err);
    res.status(500).json({ error: "Webhook failed" });
  }
});

// ─── POST /confirm-crypto — admin/manual crypto confirmation ──
router.post("/confirm-crypto", async (req, res) => {
  try {
    const secret = req.headers["x-admin-secret"] || req.headers["x-bot-token"];
    if (!secret || (secret !== process.env.BOT_TOKEN && secret !== process.env.ADMIN_SECRET)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userId, planId, txHash } = req.body;
    if (!userId || !planId) return res.status(400).json({ error: "Missing userId/planId" });

    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const priceInfo = plan.prices.crypto;
    const result = await activateSubscription({
      userId,
      planId,
      provider: "crypto",
      providerPaymentId: txHash || null,
      amount: priceInfo.amount,
      currency: "USDT",
    });

    res.json({ success: true, expiresAt: result.expiresAt });
  } catch (err) {
    console.error("Confirm crypto error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

// ─── GET /history ────────────────────────────────────────
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
