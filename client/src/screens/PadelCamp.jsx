import React, { useState } from 'react';
import { COLORS } from '../config';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Header } from '../components/ui/Header';
import { useTelegram } from '../hooks/useTelegram';

const CAMP_CONTACT = 'https://t.me/vladlopunov';

const INCLUDES = [
  {
    icon: '\u{1F3BE}',
    title: 'Спорт',
    items: [
      '9+ часов тренировок с про-тренерами',
      'Распределение по уровням (D/C/B/A)',
      'Финальный турнир с награждением',
      'Видеоанализ вашей игры',
      'Сертификат участника',
    ],
  },
  {
    icon: '\u{1F9D8}',
    title: 'Wellness',
    items: [
      '3 утренних йога / стрейчинг сессии',
      'Баня / спа для восстановления',
      'Мастер-класс по спортивному питанию',
    ],
  },
  {
    icon: '\u{1F30D}',
    title: 'Впечатления',
    items: [
      'Авторская экскурсия по Минску',
      'Гала-ужин в красивой локации',
      'Дегустация / мастер-класс коктейлей',
    ],
  },
  {
    icon: '\u{1F91D}',
    title: 'Комьюнити',
    items: [
      'Нетворкинг с единомышленниками',
      'Вечерние игры: Мафия, Квиз',
      'Telegram-чат навсегда',
      'Профессиональные фото и видео',
    ],
  },
];

const DAYS = [
  {
    day: 1,
    title: 'Четверг, 21 мая — Знакомство',
    schedule: [
      { time: '14:00', text: 'Регистрация, welcome-пакеты' },
      { time: '15:00', text: 'Открытие кэмпа, знакомство с тренерами' },
      { time: '15:30', text: 'Оценка уровня каждого участника' },
      { time: '16:00', text: 'Тренировка #1 — Техника (1.5 ч)' },
      { time: '18:00', text: 'Свободные игры — миксы' },
      { time: '19:30', text: 'Welcome-ужин' },
      { time: '20:30', text: 'Нетворкинг: Мафия' },
    ],
  },
  {
    day: 2,
    title: 'Пятница, 22 мая — Интенсив',
    schedule: [
      { time: '08:00', text: 'Утренняя йога / стрейчинг' },
      { time: '09:00', text: 'Тренировка #2 — Техника (1.5 ч)' },
      { time: '11:00', text: 'Тренировка #3 — Тактика (1.5 ч)' },
      { time: '12:30', text: 'Обед' },
      { time: '14:00', text: 'Мастер-класс: спортивное питание' },
      { time: '15:30', text: 'Тренировка #4 — Игровые ситуации (1.5 ч)' },
      { time: '17:00', text: 'Видеоанализ игры' },
      { time: '18:30', text: 'Баня / спа' },
      { time: '20:30', text: 'Нетворкинг: Квиз о падел' },
    ],
  },
  {
    day: 3,
    title: 'Суббота, 23 мая — Город + Игра',
    schedule: [
      { time: '08:00', text: 'Утренняя йога / стрейчинг' },
      { time: '09:00', text: 'Тренировка #5 — ProAm с тренером (1.5 ч)' },
      { time: '11:00', text: 'Тренировка #6 — Специализация по запросам' },
      { time: '12:30', text: 'Обед' },
      { time: '14:00', text: 'Авторская экскурсия по Минску (3 ч)' },
      { time: '19:00', text: 'Гала-Ужин + награждение' },
      { time: '20:00', text: 'Мастер-класс: коктейли / дегустация' },
    ],
  },
  {
    day: 4,
    title: 'Воскресенье, 24 мая — Турнир',
    schedule: [
      { time: '08:30', text: 'Лёгкая разминка' },
      { time: '09:00', text: 'Финальный турнир (3 ч)' },
      { time: '12:00', text: 'Показательный матч тренеров' },
      { time: '12:30', text: 'Торжественное закрытие, сертификаты' },
      { time: '13:30', text: 'Прощальный обед' },
    ],
  },
];

const PACKAGES = [
  {
    name: 'LIGHT',
    price: '$390',
    color: COLORS.textDim,
    items: [
      '3 групповые тренировки (4.5 ч)',
      'Свободные игры',
      'Финальный турнир',
      'Welcome-ужин',
      'Нетворкинг-программа',
      'Футболка + сертификат',
      'Фото и видео',
    ],
  },
  {
    name: 'STANDARD',
    price: '$690',
    color: COLORS.accent,
    popular: true,
    items: [
      '6 групповых тренировок (9 ч)',
      'Свободные игры + турнир',
      'Видеоанализ (групповой)',
      'Йога / стрейчинг (3 сессии)',
      'Баня / спа',
      'МК: спортивное питание',
      'Экскурсия по Минску',
      'Welcome + Гала-ужин',
      'Мафия, квиз',
      'Футболка + welcome-пакет',
    ],
  },
  {
    name: 'PREMIUM',
    price: '$890',
    color: COLORS.purple,
    items: [
      'Всё из Standard, плюс:',
      'Личная тренировка (1 ч)',
      'Персональный видеоанализ',
      'Приоритет выбора группы',
      'VIP-зона на Гала-ужине',
      'Доп. сессия бани / спа',
      'МК: дегустация / коктейли',
    ],
  },
];

export function PadelCamp({ onBack }) {
  const { openTelegramLink } = useTelegram();
  const [openDay, setOpenDay] = useState(null);

  const handleSignUp = () => {
    try {
      openTelegramLink(CAMP_CONTACT);
    } catch {
      window.open(CAMP_CONTACT, '_blank');
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header title="Padel Camp" onBack={onBack} />

      {/* Hero */}
      <div
        style={{
          borderRadius: 20,
          padding: '28px 20px',
          marginBottom: 16,
          background: `linear-gradient(135deg, ${COLORS.purple}30, ${COLORS.accent}20)`,
          border: `1px solid ${COLORS.purple}40`,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: COLORS.purple, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>
          PADEL CAMP
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, marginBottom: 4 }}>
          MINSK 2026
        </h1>
        <p style={{ fontSize: 16, color: COLORS.accent, fontWeight: 600, marginBottom: 12 }}>
          21 — 24 мая
        </p>
        <p style={{ fontSize: 14, color: COLORS.textDim, lineHeight: 1.5 }}>
          4 дня, которые изменят твою игру и круг общения
        </p>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <Badge variant="accent">{'\u{1F3BE}'} 360 Padel Arena</Badge>
          <Badge variant="purple">{'\u{1F1E7}\u{1F1FE}'} Минск</Badge>
        </div>
      </div>

      {/* What's included */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
        Что входит в кэмп
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {INCLUDES.map((section) => (
          <Card key={section.title} style={{ padding: 14 }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>{section.icon}</span>
            <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
              {section.title}
            </p>
            {section.items.map((item, i) => (
              <p key={i} style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.5 }}>
                {'\u2022'} {item}
              </p>
            ))}
          </Card>
        ))}
      </div>

      {/* Schedule */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
        Программа по дням
      </h3>
      <div style={{ marginBottom: 20 }}>
        {DAYS.map((day) => (
          <Card
            key={day.day}
            onClick={() => setOpenDay(openDay === day.day ? null : day.day)}
            style={{ marginBottom: 8, cursor: 'pointer', padding: '14px 16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: `${COLORS.accent}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 800,
                    color: COLORS.accent,
                  }}
                >
                  {day.day}
                </span>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{day.title}</p>
              </div>
              <span style={{ color: COLORS.textDim, fontSize: 14, transition: 'transform 0.2s', transform: openDay === day.day ? 'rotate(90deg)' : 'none' }}>
                {'\u203A'}
              </span>
            </div>
            {openDay === day.day && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                {day.schedule.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, minWidth: 42 }}>
                      {item.time}
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.4 }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Packages */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
        Пакеты и цены
      </h3>
      <div style={{ marginBottom: 12 }}>
        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.name}
            style={{
              marginBottom: 10,
              borderColor: pkg.popular ? `${pkg.color}60` : undefined,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {pkg.popular && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: -28,
                  background: COLORS.accent,
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 32px',
                  transform: 'rotate(45deg)',
                }}
              >
                ХИТ
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: pkg.color }}>{pkg.name}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{pkg.price}</p>
            </div>
            {pkg.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ color: pkg.color, fontSize: 12, marginTop: 2 }}>{'\u2713'}</span>
                <span style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* Early Bird */}
      <Card style={{ marginBottom: 20, background: `${COLORS.warning}10`, borderColor: `${COLORS.warning}30` }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.warning, marginBottom: 8 }}>
          {'\u{1F525}'} Early Bird скидки
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: COLORS.textDim }}>До 1 апреля</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.warning }}>-10%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: COLORS.textDim }}>До 20 апреля</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.warning }}>-5%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: COLORS.textDim }}>Группа 3+ человек</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.warning }}>-7% каждому</span>
        </div>
      </Card>

      {/* Venue */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>
        Площадка
      </h3>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>{'\u{1F3DF}\u{FE0F}'}</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>360 Padel Arena</p>
            <p style={{ fontSize: 12, color: COLORS.textDim }}>Минск, Новая Боровая</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge>7 кортов</Badge>
          <Badge>Mondo SuperCourt XN</Badge>
          <Badge>LED-освещение</Badge>
          <Badge variant="accent">Стандарт WPT</Badge>
        </div>
      </Card>

      {/* CTA */}
      <Button variant="purple" fullWidth size="lg" onClick={handleSignUp}>
        {'\u{1F3BE}'} Записаться / Узнать подробности
      </Button>
      <p style={{ textAlign: 'center', fontSize: 12, color: COLORS.textDim, marginTop: 8 }}>
        Свяжемся с вами в Telegram
      </p>
    </div>
  );
}
