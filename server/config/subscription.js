// Subscription plans — Telegram Stars pricing
// 1 Star ≈ $0.015, so 150 Stars ≈ $2.25, 1200 Stars ≈ $18

module.exports = {
  PLANS: {
    pro_monthly: {
      id: "pro_monthly",
      title: "Padel GO PRO — 1 месяц",
      description: "Расширенная статистика, H2H, фильтры лидерборда, VIP-бейдж и другие PRO-функции",
      price: 150, // Telegram Stars
      currency: "XTR",
      durationDays: 30,
      label: "1 месяц",
    },
    pro_yearly: {
      id: "pro_yearly",
      title: "Padel GO PRO — 1 год",
      description: "Все PRO-функции на год. Экономия 33% по сравнению с месячной подпиской!",
      price: 1200, // Telegram Stars (~$18 vs $27 monthly)
      currency: "XTR",
      durationDays: 365,
      label: "1 год",
    },
  },

  // Features gated behind PRO
  PRO_FEATURES: [
    "advanced_stats",       // Графики, паттерны, месячная активность
    "head_to_head",         // H2H статистика против любого игрока
    "pair_details",         // Детали парного рейтинга
    "leaderboard_filters",  // Фильтры "за месяц", "за неделю"
    "all_achievements",     // Все достижения + прогресс
    "calendar_export",      // Экспорт матча в .ics
    "unlimited_matches",    // Без лимита активных матчей
    "unlimited_invites",    // Без лимита приглашений
    "priority_search",      // Выше в поиске партнёров
    "vip_badge",            // VIP-бейдж в лидерборде и профиле
    "weekly_summary",       // Еженедельная бот-сводка
    "rating_edit_extra",    // Доп. корректировка рейтинга раз в 3 месяца
  ],
};
