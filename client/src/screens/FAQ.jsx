import React, { useState } from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';

const FAQ_DATA = [
  {
    section: '🎾 Общие вопросы',
    items: [
      {
        q: 'Что такое Padel GO?',
        a: 'Padel GO — это Telegram Mini App для падел-сообщества Беларуси. Здесь вы можете находить матчи, отслеживать рейтинг, участвовать в турнирах и получать достижения.',
      },
      {
        q: 'Как начать пользоваться?',
        a: 'Откройте бота @PadelGoBY_bot → /start → «Открыть Padel GO». Пройдите онбординг: выбор города, установка рейтинга, настройка профиля.',
      },
      {
        q: 'Это бесплатно?',
        a: 'Да, полностью бесплатно для всех игроков.',
      },
    ],
  },
  {
    section: '📊 Рейтинг',
    items: [
      {
        q: 'Как определяется стартовый рейтинг?',
        a: 'Два варианта:\n• Импорт — конвертация рейтинга из Raceto, Playtomic или другой системы в шкалу 0–5000\n• Анкета — 6 вопросов об опыте (результат: 1000–2500)',
      },
      {
        q: 'Как рейтинг меняется после матча?',
        a: 'Система Elo: считается средний рейтинг команд, по разнице определяется ожидаемый результат. Победа над сильным = много очков, проигрыш слабому = большая потеря.',
      },
      {
        q: 'Что такое K-фактор?',
        a: '• 0–10 матчей: K=50 (калибровка, быстрые изменения)\n• 11–30 матчей: K=40 (промежуточная)\n• 31+ матчей: K=32 (стабильный рейтинг)',
      },
      {
        q: 'Что такое модификаторы сетов?',
        a: '• Разгром 6-0 / 6-1: ×1.15 (больше очков)\n• Тайбрейк 7-6: ×0.90 (меньше, матч равный)\n• 3 сета: ×1.10 (бонус за длинный матч)',
      },
      {
        q: 'Какие уровни существуют?',
        a: '• D (0–2500) — Новичок\n• C (2501–3500) — Любитель\n• B (3501–4500) — Продвинутый\n• A (4501–5000) — Сильный',
      },
      {
        q: 'Можно изменить рейтинг вручную?',
        a: 'Да, один раз. Корректировка ±500 очков. После — рейтинг меняется только по результатам матчей.',
      },
      {
        q: 'Дружеские матчи влияют на рейтинг?',
        a: 'Нет. Только рейтинговые (RATED) матчи меняют Elo. Дружеские засчитываются в статистику и достижения.',
      },
    ],
  },
  {
    section: '🎾 Матчи',
    items: [
      {
        q: 'Как создать матч?',
        a: 'Кнопка «+ Создать матч» в приложении или /create в боте. Выберите дату, время, площадку, длительность, уровень и тип матча.',
      },
      {
        q: 'Как найти и вступить в матч?',
        a: '• В приложении: вкладка «Матчи» → список → «Присоединиться»\n• В боте: /find → кнопка «Вступить»\nСоздатель матча одобрит или отклонит заявку.',
      },
      {
        q: 'Можно записать уже сыгранный матч?',
        a: 'Да. «Записать счёт» → «Записать сыгранный матч» → выберите дату в прошлом, 3 игроков и введите результат.',
      },
      {
        q: 'Какие статусы у матча?',
        a: '🟡 Набор — ищем игроков\n🟢 Собран — 4/4 на месте\n🔵 В процессе — идёт игра\n🟠 Ожидает счёт\n🟣 Подтверждение\n✅ Завершён\n❌ Отменён',
      },
      {
        q: 'Как выйти из матча?',
        a: 'В приложении — «Покинуть матч». В боте — /cancel. Если уходит создатель — матч удаляется.',
      },
    ],
  },
  {
    section: '📝 Счёт и подтверждение',
    items: [
      {
        q: 'Как ввести результат?',
        a: '1. Распределите 4 игроков по командам\n2. Введите счёт по сетам (6-3, 4-6, 6-2)\n3. При 7-6 появится поле тайбрейка\n4. Нажмите «Отправить»',
      },
      {
        q: 'Кто подтверждает счёт?',
        a: 'Любой игрок соперника. Уведомление приходит в Telegram с кнопками «Подтвердить» / «Оспорить».',
      },
      {
        q: 'Что если счёт не подтвердили?',
        a: 'Есть 7 дней. Если никто не отреагировал — счёт засчитывается автоматически.',
      },
      {
        q: 'Можно оспорить счёт?',
        a: 'Да. Нажмите «Оспорить» — предложите свой вариант. Решайте между собой.',
      },
    ],
  },
  {
    section: '🏅 Достижения и XP',
    items: [
      {
        q: 'Как работают достижения?',
        a: '23 достижения по 6 категориям. Открываются автоматически — вам придёт уведомление. Каждое даёт XP.',
      },
      {
        q: 'Какие категории?',
        a: '🎾 Матчи — за количество игр\n⚡ Победы — серии, камбэки, сухари\n📊 Рейтинг — достижение порогов\n🤝 Социальные — партнёры, города\n🏆 Турниры — участие и победы',
      },
      {
        q: 'Что даёт XP?',
        a: 'Уровни опыта:\n🌱 Новичок (0)\n🌿 Активист (200)\n🌳 Регуляр (500)\n⭐ Ветеран (1000)\n💎 Мастер (2000)\n👑 Легенда (3500)',
      },
    ],
  },
  {
    section: '🏆 Турниры',
    items: [
      {
        q: 'Как участвовать?',
        a: 'Вкладка «Турниры» → выберите → зарегистрируйтесь с партнёром (формат 2×2).',
      },
      {
        q: 'Влияют ли турниры на рейтинг?',
        a: 'Да. Турнирные матчи могут иметь повышенный множитель (×1.5) — рейтинг меняется сильнее.',
      },
    ],
  },
  {
    section: '🤖 Бот',
    items: [
      {
        q: 'Какие команды есть?',
        a: '/me — Мой профиль\n/top — Топ-10\n/matches — Мои матчи\n/find — Найти матч\n/create — Создать матч\n/cancel — Выйти из матча\n/faq — FAQ\n/help — Справка',
      },
      {
        q: 'Какие уведомления присылает бот?',
        a: '⏰ Напоминания о матчах\n🎉 Матч собран\n✅ Приняли/отклонили заявку\n📊 Изменение рейтинга\n🏅 Достижения\n📋 Еженедельная сводка\n👋 Напоминание неактивным',
      },
      {
        q: 'Можно всё делать через бота?',
        a: 'Основное — да (профиль, матчи, рейтинг). Но детальное управление (команды в матче, ввод счёта, турниры) — только в приложении.',
      },
    ],
  },
  {
    section: '⚙️ Настройки',
    items: [
      {
        q: 'Что можно настроить?',
        a: '🏙️ Город\n✋ Рука / позиция / опыт\n⏰ Время для игры\n🔔 Напоминания (2ч / 1ч / 30мин / выкл)\n👁️ Видимость в поиске\n📊 Корректировка рейтинга (1 раз)',
      },
      {
        q: 'Что видят другие в моём профиле?',
        a: 'Имя, фото, город, рейтинг, уровень, статистику, достижения, руку и позицию.',
      },
      {
        q: 'Что такое VIP?',
        a: 'VIP ⭐ — значок на профиле. Назначается администрацией.',
      },
      {
        q: 'Можно добавить матч в календарь?',
        a: 'Да. В матче нажмите «Скачать в календарь» — .ics файл с датой, временем и адресом.',
      },
    ],
  },
  {
    section: '❗ Частые проблемы',
    items: [
      {
        q: 'Рейтинг не изменился после матча',
        a: '• Счёт ещё не подтверждён (проверьте «Мои матчи»)\n• Матч был дружеский (FRIENDLY)\n• Подождите до 7 дней',
      },
      {
        q: 'Не приходят уведомления',
        a: 'Убедитесь, что бот не заблокирован. Напишите /start чтобы перезапустить.',
      },
      {
        q: 'Хочу удалить аккаунт',
        a: 'Напишите администратору через чат сообщества @PadelMateChat.',
      },
    ],
  },
];

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '12px 0',
        borderBottom: `1px solid ${COLORS.border}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0, flex: 1 }}>{q}</p>
        <span
          style={{
            fontSize: 18,
            color: COLORS.textDim,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </div>
      {isOpen && (
        <p
          style={{
            fontSize: 13,
            color: COLORS.textDim,
            marginTop: 8,
            marginBottom: 0,
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export function FAQ({ onBack }) {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredSections = searchQuery.trim()
    ? FAQ_DATA.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((section) => section.items.length > 0)
    : FAQ_DATA;

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.accent,
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><HelpCircle size={20} /> FAQ</h2>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Поиск по FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.card,
            color: COLORS.text,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Sections */}
      {filteredSections.length === 0 && (
        <p style={{ textAlign: 'center', color: COLORS.textDim, fontSize: 14, marginTop: 40 }}>
          Ничего не найдено
        </p>
      )}

      {filteredSections.map((section, si) => (
        <Card key={si} style={{ marginBottom: 12 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
            {section.section}
          </h4>
          {section.items.map((item, qi) => {
            const key = `${si}_${qi}`;
            return (
              <FAQItem
                key={key}
                q={item.q}
                a={item.a}
                isOpen={!!openItems[key] || !!searchQuery.trim()}
                onToggle={() => toggleItem(key)}
              />
            );
          })}
        </Card>
      ))}
    </div>
  );
}
