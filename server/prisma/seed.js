const prisma = require("../lib/prisma");

const countries = [
  { code: "BY", name: "Беларусь", flag: "🇧🇾", sortOrder: 1 },
  { code: "RU", name: "Россия", flag: "🇷🇺", sortOrder: 2 },
  { code: "ID", name: "Индонезия", flag: "🇮🇩", sortOrder: 3 },
  { code: "AE", name: "ОАЭ", flag: "🇦🇪", sortOrder: 4 },
];

const regions = [
  // Беларусь
  { code: "MINSK", name: "Минск", countryCode: "BY", timezone: "Europe/Minsk", sortOrder: 1 },
  { code: "BREST", name: "Брест", countryCode: "BY", timezone: "Europe/Minsk", sortOrder: 2 },
  { code: "GRODNO", name: "Гродно", countryCode: "BY", timezone: "Europe/Minsk", sortOrder: 3 },
  // Россия
  { code: "MOSCOW", name: "Москва", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 1 },
  { code: "SPB", name: "Санкт-Петербург", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 2 },
  { code: "EKATERINBURG", name: "Екатеринбург", countryCode: "RU", timezone: "Asia/Yekaterinburg", sortOrder: 3 },
  { code: "KAZAN", name: "Казань", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 4 },
  { code: "SOCHI", name: "Сочи", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 5 },
  { code: "KRASNODAR", name: "Краснодар", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 6 },
  { code: "ROSTOV", name: "Ростов-на-Дону", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 7 },
  { code: "VOLGOGRAD", name: "Волгоград", countryCode: "RU", timezone: "Europe/Volgograd", sortOrder: 8 },
  { code: "SAMARA", name: "Самара", countryCode: "RU", timezone: "Europe/Samara", sortOrder: 9 },
  { code: "CHELYABINSK", name: "Челябинск", countryCode: "RU", timezone: "Asia/Yekaterinburg", sortOrder: 10 },
  { code: "NOVOSIBIRSK", name: "Новосибирск", countryCode: "RU", timezone: "Asia/Novosibirsk", sortOrder: 11 },
  { code: "KRASNOYARSK", name: "Красноярск", countryCode: "RU", timezone: "Asia/Krasnoyarsk", sortOrder: 12 },
  { code: "VORONEZH", name: "Воронеж", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 13 },
  { code: "SARATOV", name: "Саратов", countryCode: "RU", timezone: "Europe/Saratov", sortOrder: 14 },
  { code: "OMSK", name: "Омск", countryCode: "RU", timezone: "Asia/Omsk", sortOrder: 15 },
  { code: "YAROSLAVL", name: "Ярославль", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 16 },
  { code: "MURMANSK", name: "Мурманск", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 17 },
  { code: "KALININGRAD", name: "Калининград", countryCode: "RU", timezone: "Europe/Kaliningrad", sortOrder: 18 },
  { code: "KHABAROVSK", name: "Хабаровск", countryCode: "RU", timezone: "Asia/Vladivostok", sortOrder: 19 },
  { code: "TULA", name: "Тула", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 20 },
  { code: "TVER", name: "Тверь", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 21 },
  { code: "BELGOROD", name: "Белгород", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 22 },
  { code: "IVANOVO", name: "Иваново", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 23 },
  { code: "KALUGA", name: "Калуга", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 24 },
  { code: "ORENBURG", name: "Оренбург", countryCode: "RU", timezone: "Asia/Yekaterinburg", sortOrder: 25 },
  { code: "IZHEVSK", name: "Ижевск", countryCode: "RU", timezone: "Europe/Samara", sortOrder: 26 },
  { code: "SURGUT", name: "Сургут", countryCode: "RU", timezone: "Asia/Yekaterinburg", sortOrder: 27 },
  { code: "MAGNITOGORSK", name: "Магнитогорск", countryCode: "RU", timezone: "Asia/Yekaterinburg", sortOrder: 28 },
  { code: "VLADIKAVKAZ", name: "Владикавказ", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 29 },
  { code: "SARANSK", name: "Саранск", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 30 },
  { code: "ANAPA", name: "Анапа", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 31 },
  { code: "YALTA", name: "Ялта", countryCode: "RU", timezone: "Europe/Simferopol", sortOrder: 32 },
  { code: "SIMFEROPOL", name: "Симферополь", countryCode: "RU", timezone: "Europe/Simferopol", sortOrder: 33 },
  { code: "NAB_CHELNY", name: "Набережные Челны", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 34 },
  { code: "GORNO_ALTAYSK", name: "Горно-Алтайск", countryCode: "RU", timezone: "Asia/Barnaul", sortOrder: 35 },
  { code: "MAKHACHKALA", name: "Махачкала", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 36 },
  { code: "NOVOCHERKASSK", name: "Новочеркасск", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 37 },
  { code: "TIMASHEVSK", name: "Тимашевск", countryCode: "RU", timezone: "Europe/Moscow", sortOrder: 38 },
  { code: "SVETLOGORSK", name: "Светлогорск", countryCode: "RU", timezone: "Europe/Kaliningrad", sortOrder: 39 },
];

const venues = [
  // === Беларусь ===
  { name: "Padel Club Minsk", address: "ул. Притыцкого 60", regionCode: "MINSK", courts: 3 },
  { name: "Padel Arena", address: "ул. Кальварийская 1", regionCode: "MINSK", courts: 2 },
  { name: "Tennis Club Minsk", address: "ул. Сурганова 2", regionCode: "MINSK", courts: 1 },
  { name: "Sport Palace Brest", address: "ул. Ленина 10", regionCode: "BREST", courts: 2 },
  { name: "Arena Brest Padel", address: "ул. Московская 275", regionCode: "BREST", courts: 1 },
  { name: "Grodno Padel Club", address: "ул. Горького 82", regionCode: "GRODNO", courts: 2 },

  // === Москва и МО ===
  { name: "Lunda Padel Речной", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "JetArena", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Lunda Padel Фили", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Padel A33", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Padel Friends", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "MoscowPDL", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел Мультиспорт", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Vnukovo Sport Club", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "PlayPark", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Lunda Padel Конструктор", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Академия Будущего Нагатинская", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "ПадлхАБ Ясенево", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "ПадлхАБ Терехово", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "ПадлхАБ Сколково", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Sky Padel", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "КОРТЫ СЕТКИ", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "TENNIS.RU", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел клуб Жуковка", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "N-Ergo Новая Опалиха", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "Ракетлон", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Сколково Школа Тенниса", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Skorik Tennis Club", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Panorama Padel", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Berta Village", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "Air Arena", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Padel Battle", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "PARI Padel Admiral", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Jet Arena Benelux", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Padel Land", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Tennis Family Club", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел-корт на стадионе Металлист", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел-корт спортшколы Приалит", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "Pride Wellness Club", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Ангелы Плющенко Горки-10", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "Ангелы Плющенко Москва", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел центр Арктика", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Bandeha Padel Arena", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "CoolSport Воробьевы горы", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "CoolSport Парк Малевича", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "First Padel Club", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Орбита Теннис Парк", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "WIN BOX", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Заряд Падел", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Padel Park", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Buenos Padel", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Салют Geraklion", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел Nok", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "ZVI Padel", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Pari Padel 8 марта", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "ZASPORT", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Навка Арена", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "ПадлхАБ Нагатинская Premium", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Up2 Padel", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел-теннис БОР", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел Технополис", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Vamos Padel Club", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Падел-центр Лазутинка", address: "Одинцово", regionCode: "MOSCOW", courts: 1 },
  { name: "NEVEL Padel Club Кэмбридж", address: "Московская обл.", regionCode: "MOSCOW", courts: 1 },
  { name: "Московские сезоны на Авиационной", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Московские сезоны на Матвеевской", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Московские сезоны на Грекова", address: "Москва", regionCode: "MOSCOW", courts: 1 },
  { name: "Family Court Sport Park Зеленоград", address: "Зеленоград", regionCode: "MOSCOW", courts: 1 },
  { name: "The Rink Fitness", address: "Москва", regionCode: "MOSCOW", courts: 1 },

  // === Санкт-Петербург ===
  { name: "Padel Pro", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Охта парк", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Репино Падел тайм", address: "Репино", regionCode: "SPB", courts: 1 },
  { name: "Шанс Арена", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Padel Point", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Padel Star", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Gazpadel", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Win Win Padel", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "ВМЯЧ", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Лужайка Падел", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Ракета", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Комета", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "K5 Padel", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Prim-Padel на Оптиков", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Prim-Padel на Шаврова", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Pari Padel Арсенал", address: "Санкт-Петербург", regionCode: "SPB", courts: 1 },
  { name: "Спортклуб Лесной Олень", address: "Ленинградская обл.", regionCode: "SPB", courts: 1 },

  // === Екатеринбург ===
  { name: "Территория Сквош & Падел", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Центр Тенниса Урал", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "RCC Padel Academy", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Падел Уктус", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Лесная жемчужина", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Padel&Squash Club", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Падел-арена РМК", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Падел, но поднимался", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Падел клуб", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Паорт", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },
  { name: "Падел КомсоМолл", address: "Екатеринбург", regionCode: "EKATERINBURG", courts: 1 },

  // === Казань ===
  { name: "АРТЕН", address: "Казань", regionCode: "KAZAN", courts: 1 },
  { name: "Лайм Падел", address: "Казань", regionCode: "KAZAN", courts: 1 },
  { name: "Padel Friends Казань", address: "Казань", regionCode: "KAZAN", courts: 1 },
  { name: "Загородный клуб Утрау", address: "Казань", regionCode: "KAZAN", courts: 1 },
  { name: "Паделтон", address: "Казань", regionCode: "KAZAN", courts: 1 },

  // === Сочи ===
  { name: "Lunda Фишт", address: "Сочи", regionCode: "SOCHI", courts: 1 },
  { name: "Lunda Padel Фрунзе", address: "Сочи", regionCode: "SOCHI", courts: 1 },
  { name: "Сочи Парк Отель", address: "Сочи", regionCode: "SOCHI", courts: 1 },
  { name: "Mantera Residence", address: "Сочи", regionCode: "SOCHI", courts: 1 },
  { name: "ПадлхАБ Сириус", address: "Сириус", regionCode: "SOCHI", courts: 1 },
  { name: "Звездный падел", address: "Сочи", regionCode: "SOCHI", courts: 1 },

  // === Краснодар ===
  { name: "СпортПарк", address: "Краснодар", regionCode: "KRASNODAR", courts: 1 },
  { name: "X-fit Краснодар", address: "Краснодар", regionCode: "KRASNODAR", courts: 1 },
  { name: "Теннисный клуб На высоте", address: "Краснодар", regionCode: "KRASNODAR", courts: 1 },
  { name: "Спортивная академия Вопреки", address: "Краснодар", regionCode: "KRASNODAR", courts: 1 },
  { name: "Теннисная школа На Кортах", address: "Краснодар", regionCode: "KRASNODAR", courts: 1 },

  // === Ростов-на-Дону ===
  { name: "Padel 61", address: "Ростов-на-Дону", regionCode: "ROSTOV", courts: 1 },
  { name: "Падел-корт на Гребном канале", address: "Ростов-на-Дону", regionCode: "ROSTOV", courts: 1 },
  { name: "Теннисный клуб Олимпик", address: "Ростов-на-Дону", regionCode: "ROSTOV", courts: 1 },
  { name: "Спортклуб Первая миля", address: "Ростов-на-Дону", regionCode: "ROSTOV", courts: 1 },

  // === Волгоград ===
  { name: "Locos Padel на Лавочкина", address: "Волгоград", regionCode: "VOLGOGRAD", courts: 1 },
  { name: "Арена Теннис", address: "Волгоград", regionCode: "VOLGOGRAD", courts: 1 },
  { name: "Locos Padel Семь Ветров", address: "Волгоград", regionCode: "VOLGOGRAD", courts: 1 },
  { name: "City Padel", address: "Волгоград", regionCode: "VOLGOGRAD", courts: 1 },
  { name: "Площадка в парке Волжский", address: "Волжский", regionCode: "VOLGOGRAD", courts: 1 },
  { name: "Парк Три Тенниса", address: "Волгоград", regionCode: "VOLGOGRAD", courts: 1 },

  // === Самара ===
  { name: "1st Padel Sport Samara", address: "Самара", regionCode: "SAMARA", courts: 1 },
  { name: "Pulse Padel", address: "Самара", regionCode: "SAMARA", courts: 1 },
  { name: "Padel 63", address: "Самара", regionCode: "SAMARA", courts: 1 },
  { name: "Padel Central", address: "Самара", regionCode: "SAMARA", courts: 1 },

  // === Челябинск ===
  { name: "RealTennisClub", address: "Челябинск", regionCode: "CHELYABINSK", courts: 1 },
  { name: "Падел в СК Папилон", address: "Челябинск", regionCode: "CHELYABINSK", courts: 1 },
  { name: "Сквош клуб S2", address: "Челябинск", regionCode: "CHELYABINSK", courts: 1 },
  { name: "МСК Арена", address: "Челябинск", regionCode: "CHELYABINSK", courts: 1 },
  { name: "Padel Space", address: "Челябинск", regionCode: "CHELYABINSK", courts: 1 },

  // === Новосибирск ===
  { name: "Padel Tennis Club Сибирский гигант", address: "Новосибирск", regionCode: "NOVOSIBIRSK", courts: 1 },
  { name: "Padel Tennis Club Станционная", address: "Новосибирск", regionCode: "NOVOSIBIRSK", courts: 1 },

  // === Красноярск ===
  { name: "Падел-корт Остров отдыха", address: "Красноярск", regionCode: "KRASNOYARSK", courts: 1 },
  { name: "Остров отдыха", address: "Красноярск", regionCode: "KRASNOYARSK", courts: 1 },
  { name: "Падел Прайм", address: "Красноярск", regionCode: "KRASNOYARSK", courts: 1 },

  // === Воронеж ===
  { name: "Hola Padel", address: "Воронеж", regionCode: "VORONEZH", courts: 1 },
  { name: "X4 Padel", address: "Воронеж", regionCode: "VORONEZH", courts: 1 },

  // === Саратов ===
  { name: "FITLETO Саратов", address: "Саратов", regionCode: "SARATOV", courts: 1 },
  { name: "Lunda Padel Саратов", address: "Саратов", regionCode: "SARATOV", courts: 1 },
  { name: "FITLETO Энгельс", address: "Энгельс", regionCode: "SARATOV", courts: 1 },

  // === Омск ===
  { name: "Flex Padel", address: "Омск", regionCode: "OMSK", courts: 1 },
  { name: "Flex Gym Padel", address: "Омск", regionCode: "OMSK", courts: 1 },

  // === Ярославль ===
  { name: "Padel Arena Ярославль", address: "Ярославль", regionCode: "YAROSLAVL", courts: 1 },
  { name: "Padel Star Ярославль", address: "Ярославль", regionCode: "YAROSLAVL", courts: 1 },

  // === Мурманск ===
  { name: "X-fit Мурманск", address: "Мурманск", regionCode: "MURMANSK", courts: 1 },

  // === Калининград ===
  { name: "Padel Friends Калининград", address: "Калининград", regionCode: "KALININGRAD", courts: 1 },

  // === Хабаровск ===
  { name: "Падел в ТЦ Квадрат", address: "Хабаровск", regionCode: "KHABAROVSK", courts: 1 },
  { name: "4 Courts", address: "Хабаровск", regionCode: "KHABAROVSK", courts: 1 },

  // === Тула ===
  { name: "Padel Point Тула", address: "Тула", regionCode: "TULA", courts: 1 },

  // === Тверь ===
  { name: "Buenos Padel Тверь", address: "Тверь", regionCode: "TVER", courts: 1 },
  { name: "Activity Village", address: "Тверская обл.", regionCode: "TVER", courts: 1 },

  // === Белгород ===
  { name: "Велнес Курорт Ривьера", address: "Белгород", regionCode: "BELGOROD", courts: 1 },
  { name: "Сити Padel Club", address: "Белгород", regionCode: "BELGOROD", courts: 1 },
  { name: "Padel Tennis Club Валуйки", address: "Валуйки", regionCode: "BELGOROD", courts: 1 },

  // === Иваново ===
  { name: "Padel Place", address: "Иваново", regionCode: "IVANOVO", courts: 1 },

  // === Калуга ===
  { name: "Спортпарк Калужники", address: "Калуга", regionCode: "KALUGA", courts: 1 },

  // === Оренбург ===
  { name: "Спортивный центр СЕТКА", address: "Оренбург", regionCode: "ORENBURG", courts: 1 },
  { name: "Падел в роще", address: "Оренбург", regionCode: "ORENBURG", courts: 1 },

  // === Ижевск ===
  { name: "Теннисный клуб в Ижевске", address: "Ижевск", regionCode: "IZHEVSK", courts: 1 },
  { name: "Лувр спорта", address: "Ижевск", regionCode: "IZHEVSK", courts: 1 },

  // === Сургут ===
  { name: "Малибу", address: "Сургут", regionCode: "SURGUT", courts: 1 },

  // === Магнитогорск ===
  { name: "Корт в Парке Притяжение", address: "Магнитогорск", regionCode: "MAGNITOGORSK", courts: 1 },

  // === Владикавказ ===
  { name: "Bajada Padel Club", address: "Владикавказ", regionCode: "VLADIKAVKAZ", courts: 1 },

  // === Саранск ===
  { name: "Padel Saransk", address: "Саранск", regionCode: "SARANSK", courts: 1 },

  // === Анапа ===
  { name: "Теннисная академия Барс", address: "Анапа", regionCode: "ANAPA", courts: 1 },

  // === Ялта ===
  { name: "Pallasa", address: "Ялта", regionCode: "YALTA", courts: 1 },
  { name: "Padel Breeze Royal", address: "Ялта", regionCode: "YALTA", courts: 1 },

  // === Симферополь ===
  { name: "Padel Royal Arena", address: "Симферополь", regionCode: "SIMFEROPOL", courts: 1 },
  { name: "Level Padel", address: "Симферополь", regionCode: "SIMFEROPOL", courts: 1 },

  // === Набережные Челны ===
  { name: "GazPadel Набережные Челны", address: "Набережные Челны", regionCode: "NAB_CHELNY", courts: 1 },

  // === Горно-Алтайск ===
  { name: "Altai Palace", address: "Горно-Алтайск", regionCode: "GORNO_ALTAYSK", courts: 1 },

  // === Махачкала ===
  { name: "Kubachi Sport Club", address: "Махачкала", regionCode: "MAKHACHKALA", courts: 1 },

  // === Новочеркасск ===
  { name: "Академия тенниса Гранит", address: "Новочеркасск", regionCode: "NOVOCHERKASSK", courts: 1 },

  // === Тимашевск ===
  { name: "Корт на стадионе Колос", address: "Тимашевск", regionCode: "TIMASHEVSK", courts: 1 },

  // === Светлогорск ===
  { name: "Светлогорский теннисный клуб", address: "Светлогорск", regionCode: "SVETLOGORSK", courts: 1 },
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
      update: { name: region.name, countryId: countryMap[countryCode], timezone: region.timezone, sortOrder: region.sortOrder },
      create: { ...regionData, countryId: countryMap[countryCode] },
    });
    regionMap[region.code] = r.id;
  }
  console.log(`Seeded ${regions.length} regions`);

  // Upsert venues by name (unique per region)
  let venueCount = 0;
  for (const venue of venues) {
    const { regionCode, ...venueData } = venue;
    const regionId = regionMap[regionCode];
    const existing = await prisma.venue.findFirst({
      where: { name: venue.name, regionId },
    });
    if (existing) {
      await prisma.venue.update({
        where: { id: existing.id },
        data: { ...venueData, regionId },
      });
    } else {
      await prisma.venue.create({
        data: { ...venueData, regionId },
      });
    }
    venueCount++;
  }
  console.log(`Seeded ${venueCount} venues`);

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
