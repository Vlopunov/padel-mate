export const APP_NAME = "PadelMate";
export const BOT_USERNAME = "PadelMateBY_bot";
export const TG_CHANNEL = "https://t.me/PadelMateBY";
export const TG_CHAT = "https://t.me/PadelMateChat";

export const COLORS = {
  bg: "#0A0E1A",
  card: "#131828",
  accent: "#00E68A",
  accentDim: "#00C074",
  accentGlow: "rgba(0, 230, 138, 0.15)",
  warning: "#FFB020",
  danger: "#FF4757",
  purple: "#A855F7",
  text: "#E8ECF4",
  textDim: "#7A8299",
  textMuted: "#4A5068",
  border: "#1E2640",
  surface: "#0F1425",
};

export const CITIES = [
  { value: "MINSK", label: "Минск" },
  { value: "BREST", label: "Брест" },
  { value: "GRODNO", label: "Гродно" },
];

export const LEVELS = [
  { min: 0, max: 999, level: 1.0, name: "Новичок" },
  { min: 1000, max: 1199, level: 1.5, name: "Начинающий" },
  { min: 1200, max: 1399, level: 2.0, name: "Любитель" },
  { min: 1400, max: 1599, level: 2.5, name: "Средний" },
  { min: 1600, max: 1799, level: 3.0, name: "Продвинутый" },
  { min: 1800, max: 1999, level: 3.5, name: "Сильный" },
  { min: 2000, max: 9999, level: 4.0, name: "Эксперт" },
];

export const XP_LEVELS = [
  { min: 0, icon: "\u{1F331}", name: "Новичок" },
  { min: 200, icon: "\u{1F33F}", name: "Активист" },
  { min: 500, icon: "\u{1F333}", name: "Регуляр" },
  { min: 1000, icon: "\u2B50", name: "Ветеран" },
  { min: 2000, icon: "\u{1F48E}", name: "Мастер" },
  { min: 3500, icon: "\u{1F451}", name: "Легенда" },
];

export function getLevel(rating) {
  return LEVELS.find((l) => rating >= l.min && rating <= l.max) || LEVELS[0];
}

export function getXpLevel(xp) {
  let current = XP_LEVELS[0];
  for (const level of XP_LEVELS) {
    if (xp >= level.min) current = level;
  }
  const idx = XP_LEVELS.indexOf(current);
  const next = XP_LEVELS[idx + 1] || null;
  return { current, next, progress: next ? (xp - current.min) / (next.min - current.min) : 1 };
}
