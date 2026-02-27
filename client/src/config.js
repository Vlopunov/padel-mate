export const APP_NAME = "Padel GO";
export const BOT_USERNAME = "PadelGoBY_bot";
export const TG_CHANNEL = "https://t.me/+BByQAZ7kUmthNjFi";
export const TG_CHAT = "https://t.me/+8aNdiXqCrWwyMDQy";

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
  { min: 0, max: 2500, level: 1.0, category: "D", name: "Новичок", ntrp: "1.0–2.5" },
  { min: 2501, max: 3500, level: 2.0, category: "C", name: "Любитель", ntrp: "3.0–3.5" },
  { min: 3501, max: 4500, level: 3.0, category: "B", name: "Продвинутый", ntrp: "4.0–4.5" },
  { min: 4501, max: 5000, level: 4.0, category: "A", name: "Сильный", ntrp: "5.0+" },
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

export function getLevelByValue(levelFloat) {
  const exact = LEVELS.find((l) => l.level === levelFloat);
  if (exact) return exact;
  if (levelFloat <= 1.5) return LEVELS[0];
  if (levelFloat <= 2.5) return LEVELS[1];
  if (levelFloat <= 3.5) return LEVELS[2];
  return LEVELS[3];
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
