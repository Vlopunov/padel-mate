const prisma = require("../lib/prisma");

const countries = [
  { code: "BY", name: "Беларусь", flag: "🇧🇾", sortOrder: 1 },
  { code: "RU", name: "Россия", flag: "🇷🇺", sortOrder: 2 },
  { code: "ID", name: "Индонезия", flag: "🇮🇩", sortOrder: 3 },
  { code: "AE", name: "ОАЭ", flag: "🇦🇪", sortOrder: 4 },
];

const regions = [
  { code: "MINSK", name: "Минск", countryCode: "BY", timezone: "Europe/Minsk" },
  { code: "BREST", name: "Брест", countryCode: "BY", timezone: "Europe/Minsk" },
  { code: "GRODNO", name: "Гродно", countryCode: "BY", timezone: "Europe/Minsk" },
];

const venues = [
  { name: "Padel Club Minsk", address: "ул. Притыцкого 60", regionCode: "MINSK", courts: 3 },
  { name: "Padel Arena", address: "ул. Кальварийская 1", regionCode: "MINSK", courts: 2 },
  { name: "Tennis Club Minsk", address: "ул. Сурганова 2", regionCode: "MINSK", courts: 1 },
  { name: "Sport Palace Brest", address: "ул. Ленина 10", regionCode: "BREST", courts: 2 },
  { name: "Arena Brest Padel", address: "ул. Московская 275", regionCode: "BREST", courts: 1 },
  { name: "Grodno Padel Club", address: "ул. Горького 82", regionCode: "GRODNO", courts: 2 },
];

const achievements = [
  // Матчи
  { id: "first_match", name: "Первый шаг", description: "Сыграйте 1 матч", icon: "🎮", category: "matches", xp: 50, condition: { type: "matches_played", value: 1 } },
  { id: "matches_10", name: "Регулярный", description: "Сыграйте 10 матчей", icon: "🎾", category: "matches", xp: 100, condition: { type: "matches_played", value: 10 } },
  { id: "matches_50", name: "Железный", description: "Сыграйте 50 матчей", icon: "💪", category: "matches", xp: 250, condition: { type: "matches_played", value: 50 } },
  { id: "matches_100", name: "Неудержимый", description: "Сыграйте 100 матчей", icon: "🔥", category: "matches", xp: 500, condition: { type: "matches_played", value: 100 } },
  { id: "matches_month", name: "Марафонец", description: "30 матчей за месяц", icon: "📅", category: "matches", xp: 300, condition: { type: "matches_month", value: 30 } },
  // Победы
  { id: "win_streak_3", name: "Разгон", description: "3 победы подряд", icon: "⚡", category: "wins", xp: 75, condition: { type: "win_streak", value: 3 } },
  { id: "win_streak_5", name: "В огне", description: "5 побед подряд", icon: "🔥", category: "wins", xp: 150, condition: { type: "win_streak", value: 5 } },
  { id: "win_streak_10", name: "Доминация", description: "10 побед подряд", icon: "👑", category: "wins", xp: 400, condition: { type: "win_streak", value: 10 } },
  { id: "comeback", name: "Камбэк", description: "Победа после 0-1 по сетам", icon: "🔄", category: "wins", xp: 100, condition: { type: "comeback", value: 1 } },
  { id: "clean_sheet", name: "Сухая победа", description: "Выиграйте сет 6-0", icon: "🧹", category: "wins", xp: 120, condition: { type: "clean_sheet", value: 1 } },
  { id: "winrate_70", name: "Стабильность", description: "70%+ побед (мин 20 матчей)", icon: "📈", category: "wins", xp: 200, condition: { type: "winrate", value: 70, minMatches: 20 } },
  // Рейтинг
  { id: "rating_up_50", name: "Рост", description: "+50 рейтинга за неделю", icon: "⭐", category: "rating", xp: 100, condition: { type: "rating_week_gain", value: 50 } },
  { id: "rating_up_100", name: "Восходящая звезда", description: "+100 рейтинга за неделю", icon: "🌟", category: "rating", xp: 200, condition: { type: "rating_week_gain", value: 100 } },
  { id: "rating_1500", name: "Бронза", description: "Достигните рейтинга 1500", icon: "🥉", category: "rating", xp: 150, condition: { type: "rating_reached", value: 1500 } },
  { id: "rating_1800", name: "Серебро", description: "Достигните рейтинга 1800", icon: "🥈", category: "rating", xp: 300, condition: { type: "rating_reached", value: 1800 } },
  { id: "rating_2000", name: "Золото", description: "Достигните рейтинга 2000", icon: "🥇", category: "rating", xp: 500, condition: { type: "rating_reached", value: 2000 } },
  { id: "giant_slayer", name: "Убийца гигантов", description: "Победа над командой с рейтингом +200", icon: "⚔️", category: "rating", xp: 180, condition: { type: "giant_slayer", value: 200 } },
  // Социальные
  { id: "partners_5", name: "Коммуникабельный", description: "Сыграйте с 5 разными партнёрами", icon: "🤝", category: "social", xp: 75, condition: { type: "unique_partners", value: 5 } },
  { id: "partners_20", name: "Нетворкер", description: "Сыграйте с 20 разными партнёрами", icon: "🌐", category: "social", xp: 200, condition: { type: "unique_partners", value: 20 } },
  { id: "create_match", name: "Организатор", description: "Создайте 10 матчей", icon: "📋", category: "social", xp: 100, condition: { type: "matches_created", value: 10 } },
  { id: "multi_region", name: "Путешественник", description: "Играйте во всех регионах", icon: "🗺️", category: "social", xp: 250, condition: { type: "all_regions", value: 3 } },
  { id: "all_venues", name: "Исследователь", description: "Играйте на всех площадках", icon: "🏟️", category: "social", xp: 300, condition: { type: "all_venues", value: 0 } },
  // Турниры
  { id: "tournament_play", name: "Турнирщик", description: "Участие в 1 турнире", icon: "🎪", category: "tournaments", xp: 150, condition: { type: "tournaments_played", value: 1 } },
  { id: "tournament_win", name: "Чемпион", description: "Победа в турнире", icon: "🏆", category: "tournaments", xp: 500, condition: { type: "tournament_wins", value: 1 } },
  { id: "tournament_3", name: "Ветеран турниров", description: "Участие в 3 турнирах", icon: "🎖️", category: "tournaments", xp: 300, condition: { type: "tournaments_played", value: 3 } },
];

async function main() {
  console.log("Seeding database...");

  // Upsert countries first
  const countryMap = {};
  for (const country of countries) {
    const c = await prisma.country.upsert({
      where: { code: country.code },
      update: { name: country.name, flag: country.flag, sortOrder: country.sortOrder },
      create: country,
    });
    countryMap[country.code] = c.id;
  }
  console.log(`Seeded ${countries.length} countries`);

  // Upsert regions
  const regionMap = {};
  for (const region of regions) {
    const { countryCode, ...regionData } = region;
    const r = await prisma.region.upsert({
      where: { code: region.code },
      update: { name: region.name, countryId: countryMap[countryCode], timezone: region.timezone },
      create: { ...regionData, countryId: countryMap[countryCode] },
    });
    regionMap[region.code] = r.id;
  }
  console.log(`Seeded ${regions.length} regions`);

  for (const venue of venues) {
    const { regionCode, ...venueData } = venue;
    const data = { ...venueData, regionId: regionMap[regionCode] };
    await prisma.venue.upsert({
      where: { id: venues.indexOf(venue) + 1 },
      update: data,
      create: data,
    });
  }
  console.log(`Seeded ${venues.length} venues`);

  // Dynamically set all_venues count and all_regions count
  const totalVenues = await prisma.venue.count();
  const totalRegions = await prisma.region.count({ where: { active: true } });

  for (const achievement of achievements) {
    if (achievement.id === "all_venues") {
      achievement.condition.value = totalVenues;
    }
    if (achievement.id === "multi_region") {
      achievement.condition.value = totalRegions;
    }
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }
  console.log(`Seeded ${achievements.length} achievements`);

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
