import { Keyboard } from "@maxhub/max-bot-api";

export const FAQ_SECTIONS = {
  main: {
    text:
      `❓ <b>FAQ — Padel GO</b>\n\n` +
      `Выберите раздел:\n\n` +
      `🎾 Общие вопросы\n` +
      `📊 Рейтинг и уровни\n` +
      `🎾 Матчи\n` +
      `📝 Счёт и подтверждение\n` +
      `🏅 Достижения и XP\n` +
      `🤖 Бот\n` +
      `❗ Частые проблемы`,
    keyboard: (miniAppUrl) => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("🎾 Общие", "faq_general"), Keyboard.button.callback("📊 Рейтинг", "faq_rating")],
      [Keyboard.button.callback("🎾 Матчи", "faq_matches"), Keyboard.button.callback("📝 Счёт", "faq_score")],
      [Keyboard.button.callback("🏅 Достижения", "faq_achievements"), Keyboard.button.callback("🤖 Бот", "faq_bot")],
      [Keyboard.button.callback("❗ Проблемы", "faq_problems")],
      [Keyboard.button.link("📱 Открыть FAQ в приложении", miniAppUrl)],
    ]),
  },
  general: {
    text:
      `🎾 <b>Общие вопросы</b>\n\n` +
      `<b>Что такое Padel GO?</b>\n` +
      `Mini App для падел-сообщества — матчи, рейтинг, турниры, достижения.\n\n` +
      `<b>Как начать?</b>\n` +
      `/start → «Открыть Padel GO» → онбординг (город, рейтинг, профиль).\n\n` +
      `<b>Это бесплатно?</b>\n` +
      `Да, полностью бесплатно.`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
  rating: {
    text:
      `📊 <b>Рейтинг и уровни</b>\n\n` +
      `<b>Стартовый рейтинг:</b>\n` +
      `• Импорт из Raceto/Playtomic\n` +
      `• Или анкета из 6 вопросов (1000–2500)\n\n` +
      `<b>Система Elo:</b>\n` +
      `Средний рейтинг команд → ожидаемый результат → изменение.\n\n` +
      `<b>K-фактор:</b>\n` +
      `• 0–10 матчей: K=50 (калибровка)\n` +
      `• 11–30: K=40 (промежуточная)\n` +
      `• 31+: K=32 (стабильный)\n\n` +
      `<b>Уровни:</b>\n` +
      `D (0–2500) Новичок\n` +
      `C (2501–3500) Любитель\n` +
      `B (3501–4500) Продвинутый\n` +
      `A (4501–5000) Сильный`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
  matches: {
    text:
      `🎾 <b>Матчи</b>\n\n` +
      `<b>Создать:</b> «+ Создать матч» в приложении или /create в боте\n\n` +
      `<b>Найти:</b> вкладка «Матчи» или /find в боте\n\n` +
      `<b>Записать сыгранный:</b> «Записать счёт» → дата в прошлом + 3 игрока\n\n` +
      `<b>Статусы:</b>\n` +
      `🟡 Набор → 🟢 Собран → 🔵 В процессе → 🟠 Ожидает счёт → 🟣 Подтверждение → ✅ Завершён\n\n` +
      `<b>Выйти:</b> «Покинуть матч» или /cancel`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
  score: {
    text:
      `📝 <b>Счёт и подтверждение</b>\n\n` +
      `<b>Ввод результата:</b>\n` +
      `1. Распределите 4 игроков по командам\n` +
      `2. Введите счёт по сетам\n` +
      `3. При 7-6 — поле тайбрейка\n` +
      `4. Отправьте\n\n` +
      `<b>Подтверждение:</b>\n` +
      `Любой из соперников подтверждает через бота или приложение.\n\n` +
      `<b>Автоподтверждение:</b>\n` +
      `Через 7 дней, если никто не оспорил.`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
  achievements: {
    text:
      `🏅 <b>Достижения и XP</b>\n\n` +
      `23 достижения по 6 категориям:\n\n` +
      `🎾 <b>Матчи:</b> 1/10/50/100 матчей, 30 за месяц\n` +
      `⚡ <b>Победы:</b> серии 3/5/10, камбэк, сухарь 6-0, винрейт 70%\n` +
      `📊 <b>Рейтинг:</b> +50/+100 за неделю, 1500/1800/2000, убийца гигантов\n` +
      `🤝 <b>Социальные:</b> 5/20 партнёров, 10 матчей создано, все города, все площадки\n` +
      `🏆 <b>Турниры:</b> 1/3 турнира, победа\n\n` +
      `<b>XP уровни:</b>\n` +
      `🌱 Новичок → 🌿 Активист (200) → 🌳 Регуляр (500) → ⭐ Ветеран (1000) → 💎 Мастер (2000) → 👑 Легенда (3500)`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
  bot: {
    text:
      `🤖 <b>Команды бота</b>\n\n` +
      `/me — Мой профиль и статистика\n` +
      `/top — Топ-10 игроков\n` +
      `/matches — Мои предстоящие матчи\n` +
      `/find — Найти доступный матч\n` +
      `/create — Создать новый матч\n` +
      `/cancel — Выйти из матча\n` +
      `/faq — Этот FAQ\n` +
      `/help — Справка\n\n` +
      `<b>Уведомления:</b>\n` +
      `⏰ Напоминания\n` +
      `🎉 Матч собран\n` +
      `📊 Рейтинг\n` +
      `🏅 Достижения\n` +
      `📋 Еженедельная сводка`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
  problems: {
    text:
      `❗ <b>Частые проблемы</b>\n\n` +
      `<b>Рейтинг не изменился?</b>\n` +
      `• Счёт не подтверждён\n` +
      `• Дружеский матч (не меняет рейтинг)\n` +
      `• Ждите до 7 дней\n\n` +
      `<b>Не приходят уведомления?</b>\n` +
      `Бот не заблокирован? Напишите /start\n\n` +
      `<b>Удалить аккаунт?</b>\n` +
      `Напишите в чат поддержки`,
    keyboard: () => Keyboard.inlineKeyboard([
      [Keyboard.button.callback("← Назад к разделам", "faq_back")],
    ]),
  },
};

export async function faqCommand(ctx, miniAppUrl) {
  const section = FAQ_SECTIONS.main;
  await ctx.reply(section.text, {
    format: "html",
    attachments: [section.keyboard(miniAppUrl)],
  });
}
