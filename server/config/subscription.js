// Subscription plans — multi-provider pricing
// Telegram Stars: 1 Star ≈ $0.015
// Fiat: USD-equivalent converted to BYN/RUB at checkout

module.exports = {
  PLANS: {
    pro_monthly: {
      id: "pro_monthly",
      title: "Padel GO PRO — 1 месяц",
      description: "Расширенная статистика, H2H, фильтры лидерборда, VIP-бейдж и другие PRO-функции",
      durationDays: 30,
      label: "1 месяц",
      prices: {
        stars:   { amount: 150,  currency: "XTR" },  // ~$2.25
        bepaid:  { amount: 700,  currency: "BYN" },  // 7.00 BYN (cents)
        yookassa:{ amount: 19900, currency: "RUB" },  // 199 RUB (kopecks)
        crypto:  { amount: 250,  currency: "USDT" },  // 2.50 USDT (cents)
      },
    },
    pro_yearly: {
      id: "pro_yearly",
      title: "Padel GO PRO — 1 год",
      description: "Все PRO-функции на год. Экономия 33% по сравнению с месячной подпиской!",
      durationDays: 365,
      label: "1 год",
      prices: {
        stars:   { amount: 1200,   currency: "XTR" },  // ~$18
        bepaid:  { amount: 5600,   currency: "BYN" },  // 56.00 BYN
        yookassa:{ amount: 159900, currency: "RUB" },   // 1599 RUB
        crypto:  { amount: 2000,   currency: "USDT" },  // 20.00 USDT
      },
    },
  },

  // Payment providers config
  PROVIDERS: {
    stars: {
      id: "stars",
      name: "Telegram Stars",
      icon: "star",
      description: "Оплата звёздами Telegram",
      available: true,
    },
    bepaid: {
      id: "bepaid",
      name: "Карта (Visa/MC)",
      icon: "credit-card",
      description: "Все карты кроме российских",
      available: true,
    },
    yookassa: {
      id: "yookassa",
      name: "Карта (РФ)",
      icon: "credit-card",
      description: "Российские карты",
      available: true,
    },
    crypto: {
      id: "crypto",
      name: "Крипто",
      icon: "bitcoin",
      description: "USDT, TON через @send",
      available: true,
    },
  },

  // Features gated behind PRO
  PRO_FEATURES: [
    "advanced_stats",
    "head_to_head",
    "pair_details",
    "leaderboard_filters",
    "all_achievements",
    "calendar_export",
    "unlimited_matches",
    "unlimited_invites",
    "priority_search",
    "vip_badge",
    "weekly_summary",
    "rating_edit_extra",
  ],
};
