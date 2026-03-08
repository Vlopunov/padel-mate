-- Seed Russian regions and venues from padelrus.ru

-- ============================================================
-- Russian Regions (39 total)
-- ============================================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MOSCOW', 'Москва', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SPB', 'Санкт-Петербург', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 2)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('EKATERINBURG', 'Екатеринбург', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Yekaterinburg', 3)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KAZAN', 'Казань', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 4)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SOCHI', 'Сочи', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 5)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KRASNODAR', 'Краснодар', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 6)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ROSTOV', 'Ростов-на-Дону', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 7)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('VOLGOGRAD', 'Волгоград', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Volgograd', 8)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SAMARA', 'Самара', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Samara', 9)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('CHELYABINSK', 'Челябинск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Yekaterinburg', 10)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('NOVOSIBIRSK', 'Новосибирск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Novosibirsk', 11)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KRASNOYARSK', 'Красноярск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Krasnoyarsk', 12)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('VORONEZH', 'Воронеж', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 13)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SARATOV', 'Саратов', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Saratov', 14)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('OMSK', 'Омск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Omsk', 15)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('YAROSLAVL', 'Ярославль', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 16)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MURMANSK', 'Мурманск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 17)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KALININGRAD', 'Калининград', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Kaliningrad', 18)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KHABAROVSK', 'Хабаровск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Vladivostok', 19)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TULA', 'Тула', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 20)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TVER', 'Тверь', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 21)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BELGOROD', 'Белгород', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 22)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('IVANOVO', 'Иваново', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 23)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KALUGA', 'Калуга', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 24)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ORENBURG', 'Оренбург', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Yekaterinburg', 25)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('IZHEVSK', 'Ижевск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Samara', 26)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SURGUT', 'Сургут', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Yekaterinburg', 27)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MAGNITOGORSK', 'Магнитогорск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Yekaterinburg', 28)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('VLADIKAVKAZ', 'Владикавказ', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 29)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SARANSK', 'Саранск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 30)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ANAPA', 'Анапа', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 31)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('YALTA', 'Ялта', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Simferopol', 32)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SIMFEROPOL', 'Симферополь', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Simferopol', 33)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('NAB_CHELNY', 'Набережные Челны', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 34)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('GORNO_ALTAYSK', 'Горно-Алтайск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Asia/Barnaul', 35)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MAKHACHKALA', 'Махачкала', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 36)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('NOVOCHERKASSK', 'Новочеркасск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 37)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TIMASHEVSK', 'Тимашевск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Moscow', 38)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SVETLOGORSK', 'Светлогорск', (SELECT "id" FROM "Country" WHERE "code" = 'RU'), 'Europe/Kaliningrad', 39)
ON CONFLICT ("code") DO NOTHING;

-- ============================================================
-- Russian Venues
-- ============================================================

-- === Москва и МО (63 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lunda Padel Речной', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lunda Padel Речной' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'JetArena', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'JetArena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lunda Padel Фили', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lunda Padel Фили' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel A33', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel A33' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Friends', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Friends' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'MoscowPDL', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'MoscowPDL' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел Мультиспорт', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел Мультиспорт' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Vnukovo Sport Club', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Vnukovo Sport Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'PlayPark', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'PlayPark' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lunda Padel Конструктор', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lunda Padel Конструктор' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Академия Будущего Нагатинская', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Академия Будущего Нагатинская' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ПадлхАБ Ясенево', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ПадлхАБ Ясенево' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ПадлхАБ Терехово', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ПадлхАБ Терехово' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ПадлхАБ Сколково', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ПадлхАБ Сколково' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sky Padel', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sky Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'КОРТЫ СЕТКИ', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'КОРТЫ СЕТКИ' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'TENNIS.RU', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'TENNIS.RU' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел клуб Жуковка', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел клуб Жуковка' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'N-Ergo Новая Опалиха', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'N-Ergo Новая Опалиха' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Ракетлон', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Ракетлон' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Сколково Школа Тенниса', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Сколково Школа Тенниса' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Skorik Tennis Club', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Skorik Tennis Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Panorama Padel', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Panorama Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Berta Village', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Berta Village' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Air Arena', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Air Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Battle', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Battle' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'PARI Padel Admiral', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'PARI Padel Admiral' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jet Arena Benelux', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jet Arena Benelux' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Land', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Land' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tennis Family Club', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tennis Family Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-корт на стадионе Металлист', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-корт на стадионе Металлист' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-корт спортшколы Приалит', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-корт спортшколы Приалит' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pride Wellness Club', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pride Wellness Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Ангелы Плющенко Горки-10', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Ангелы Плющенко Горки-10' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Ангелы Плющенко Москва', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Ангелы Плющенко Москва' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел центр Арктика', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел центр Арктика' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bandeha Padel Arena', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bandeha Padel Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'CoolSport Воробьевы горы', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'CoolSport Воробьевы горы' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'CoolSport Парк Малевича', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'CoolSport Парк Малевича' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'First Padel Club', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'First Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Орбита Теннис Парк', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Орбита Теннис Парк' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'WIN BOX', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'WIN BOX' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Заряд Падел', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Заряд Падел' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Park', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Park' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Buenos Padel', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Buenos Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Салют Geraklion', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Салют Geraklion' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел Nok', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел Nok' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ZVI Padel', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ZVI Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pari Padel 8 марта', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pari Padel 8 марта' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ZASPORT', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ZASPORT' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Навка Арена', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Навка Арена' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ПадлхАБ Нагатинская Premium', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ПадлхАБ Нагатинская Premium' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Up2 Padel', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Up2 Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-теннис БОР', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-теннис БОР' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел Технополис', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел Технополис' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Vamos Padel Club', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Vamos Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-центр Лазутинка', 'Одинцово', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-центр Лазутинка' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'NEVEL Padel Club Кэмбридж', 'Московская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'NEVEL Padel Club Кэмбридж' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Московские сезоны на Авиационной', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Московские сезоны на Авиационной' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Московские сезоны на Матвеевской', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Московские сезоны на Матвеевской' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Московские сезоны на Грекова', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Московские сезоны на Грекова' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Family Court Sport Park Зеленоград', 'Зеленоград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Family Court Sport Park Зеленоград' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Rink Fitness', 'Москва', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MOSCOW'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Rink Fitness' AND "regionId" = r."id");

-- === Санкт-Петербург (17 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Pro', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Pro' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Охта парк', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Охта парк' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Репино Падел тайм', 'Репино', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Репино Падел тайм' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Шанс Арена', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Шанс Арена' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Point', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Point' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Star', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Star' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Gazpadel', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Gazpadel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Win Win Padel', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Win Win Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ВМЯЧ', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ВМЯЧ' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Лужайка Падел', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Лужайка Падел' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Ракета', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Ракета' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Комета', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Комета' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'K5 Padel', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'K5 Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Prim-Padel на Оптиков', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Prim-Padel на Оптиков' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Prim-Padel на Шаврова', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Prim-Padel на Шаврова' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pari Padel Арсенал', 'Санкт-Петербург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pari Padel Арсенал' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Спортклуб Лесной Олень', 'Ленинградская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SPB'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Спортклуб Лесной Олень' AND "regionId" = r."id");

-- === Екатеринбург (11 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Территория Сквош & Падел', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Территория Сквош & Падел' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Центр Тенниса Урал', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Центр Тенниса Урал' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'RCC Padel Academy', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'RCC Padel Academy' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел Уктус', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел Уктус' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Лесная жемчужина', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Лесная жемчужина' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel&Squash Club', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel&Squash Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-арена РМК', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-арена РМК' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел, но поднимался', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел, но поднимался' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел клуб', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел клуб' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Паорт', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Паорт' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел КомсоМолл', 'Екатеринбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'EKATERINBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел КомсоМолл' AND "regionId" = r."id");

-- === Казань (5 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'АРТЕН', 'Казань', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KAZAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'АРТЕН' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Лайм Падел', 'Казань', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KAZAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Лайм Падел' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Friends Казань', 'Казань', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KAZAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Friends Казань' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Загородный клуб Утрау', 'Казань', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KAZAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Загородный клуб Утрау' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Паделтон', 'Казань', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KAZAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Паделтон' AND "regionId" = r."id");

-- === Сочи (6 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lunda Фишт', 'Сочи', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SOCHI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lunda Фишт' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lunda Padel Фрунзе', 'Сочи', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SOCHI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lunda Padel Фрунзе' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Сочи Парк Отель', 'Сочи', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SOCHI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Сочи Парк Отель' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Mantera Residence', 'Сочи', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SOCHI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Mantera Residence' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ПадлхАБ Сириус', 'Сириус', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SOCHI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ПадлхАБ Сириус' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Звездный падел', 'Сочи', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SOCHI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Звездный падел' AND "regionId" = r."id");

-- === Краснодар (5 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'СпортПарк', 'Краснодар', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNODAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'СпортПарк' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'X-fit Краснодар', 'Краснодар', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNODAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'X-fit Краснодар' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Теннисный клуб На высоте', 'Краснодар', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNODAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Теннисный клуб На высоте' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Спортивная академия Вопреки', 'Краснодар', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNODAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Спортивная академия Вопреки' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Теннисная школа На Кортах', 'Краснодар', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNODAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Теннисная школа На Кортах' AND "regionId" = r."id");

-- === Ростов-на-Дону (4 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel 61', 'Ростов-на-Дону', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ROSTOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel 61' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-корт на Гребном канале', 'Ростов-на-Дону', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ROSTOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-корт на Гребном канале' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Теннисный клуб Олимпик', 'Ростов-на-Дону', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ROSTOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Теннисный клуб Олимпик' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Спортклуб Первая миля', 'Ростов-на-Дону', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ROSTOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Спортклуб Первая миля' AND "regionId" = r."id");

-- === Волгоград (6 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Locos Padel на Лавочкина', 'Волгоград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VOLGOGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Locos Padel на Лавочкина' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Арена Теннис', 'Волгоград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VOLGOGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Арена Теннис' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Locos Padel Семь Ветров', 'Волгоград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VOLGOGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Locos Padel Семь Ветров' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'City Padel', 'Волгоград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VOLGOGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'City Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Площадка в парке Волжский', 'Волжский', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VOLGOGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Площадка в парке Волжский' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Парк Три Тенниса', 'Волгоград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VOLGOGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Парк Три Тенниса' AND "regionId" = r."id");

-- === Самара (4 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT '1st Padel Sport Samara', 'Самара', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SAMARA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = '1st Padel Sport Samara' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pulse Padel', 'Самара', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SAMARA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pulse Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel 63', 'Самара', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SAMARA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel 63' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Central', 'Самара', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SAMARA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Central' AND "regionId" = r."id");

-- === Челябинск (5 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'RealTennisClub', 'Челябинск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'CHELYABINSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'RealTennisClub' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел в СК Папилон', 'Челябинск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'CHELYABINSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел в СК Папилон' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Сквош клуб S2', 'Челябинск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'CHELYABINSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Сквош клуб S2' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'МСК Арена', 'Челябинск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'CHELYABINSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'МСК Арена' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Space', 'Челябинск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'CHELYABINSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Space' AND "regionId" = r."id");

-- === Новосибирск (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Tennis Club Сибирский гигант', 'Новосибирск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'NOVOSIBIRSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Tennis Club Сибирский гигант' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Tennis Club Станционная', 'Новосибирск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'NOVOSIBIRSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Tennis Club Станционная' AND "regionId" = r."id");

-- === Красноярск (3 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел-корт Остров отдыха', 'Красноярск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNOYARSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел-корт Остров отдыха' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Остров отдыха', 'Красноярск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNOYARSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Остров отдыха' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел Прайм', 'Красноярск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KRASNOYARSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел Прайм' AND "regionId" = r."id");

-- === Воронеж (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Hola Padel', 'Воронеж', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VORONEZH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Hola Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'X4 Padel', 'Воронеж', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VORONEZH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'X4 Padel' AND "regionId" = r."id");

-- === Саратов (3 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'FITLETO Саратов', 'Саратов', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SARATOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'FITLETO Саратов' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lunda Padel Саратов', 'Саратов', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SARATOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lunda Padel Саратов' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'FITLETO Энгельс', 'Энгельс', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SARATOV'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'FITLETO Энгельс' AND "regionId" = r."id");

-- === Омск (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Flex Padel', 'Омск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'OMSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Flex Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Flex Gym Padel', 'Омск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'OMSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Flex Gym Padel' AND "regionId" = r."id");

-- === Ярославль (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Arena Ярославль', 'Ярославль', r."id", 1, false
FROM "Region" r WHERE r."code" = 'YAROSLAVL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Arena Ярославль' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Star Ярославль', 'Ярославль', r."id", 1, false
FROM "Region" r WHERE r."code" = 'YAROSLAVL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Star Ярославль' AND "regionId" = r."id");

-- === Мурманск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'X-fit Мурманск', 'Мурманск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MURMANSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'X-fit Мурманск' AND "regionId" = r."id");

-- === Калининград (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Friends Калининград', 'Калининград', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KALININGRAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Friends Калининград' AND "regionId" = r."id");

-- === Хабаровск (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел в ТЦ Квадрат', 'Хабаровск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KHABAROVSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел в ТЦ Квадрат' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT '4 Courts', 'Хабаровск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KHABAROVSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = '4 Courts' AND "regionId" = r."id");

-- === Тула (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Point Тула', 'Тула', r."id", 1, false
FROM "Region" r WHERE r."code" = 'TULA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Point Тула' AND "regionId" = r."id");

-- === Тверь (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Buenos Padel Тверь', 'Тверь', r."id", 1, false
FROM "Region" r WHERE r."code" = 'TVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Buenos Padel Тверь' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Activity Village', 'Тверская обл.', r."id", 1, false
FROM "Region" r WHERE r."code" = 'TVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Activity Village' AND "regionId" = r."id");

-- === Белгород (3 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Велнес Курорт Ривьера', 'Белгород', r."id", 1, false
FROM "Region" r WHERE r."code" = 'BELGOROD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Велнес Курорт Ривьера' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Сити Padel Club', 'Белгород', r."id", 1, false
FROM "Region" r WHERE r."code" = 'BELGOROD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Сити Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Tennis Club Валуйки', 'Валуйки', r."id", 1, false
FROM "Region" r WHERE r."code" = 'BELGOROD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Tennis Club Валуйки' AND "regionId" = r."id");

-- === Иваново (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Place', 'Иваново', r."id", 1, false
FROM "Region" r WHERE r."code" = 'IVANOVO'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Place' AND "regionId" = r."id");

-- === Калуга (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Спортпарк Калужники', 'Калуга', r."id", 1, false
FROM "Region" r WHERE r."code" = 'KALUGA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Спортпарк Калужники' AND "regionId" = r."id");

-- === Оренбург (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Спортивный центр СЕТКА', 'Оренбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ORENBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Спортивный центр СЕТКА' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Падел в роще', 'Оренбург', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ORENBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Падел в роще' AND "regionId" = r."id");

-- === Ижевск (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Теннисный клуб в Ижевске', 'Ижевск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'IZHEVSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Теннисный клуб в Ижевске' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Лувр спорта', 'Ижевск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'IZHEVSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Лувр спорта' AND "regionId" = r."id");

-- === Сургут (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Малибу', 'Сургут', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SURGUT'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Малибу' AND "regionId" = r."id");

-- === Магнитогорск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Корт в Парке Притяжение', 'Магнитогорск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MAGNITOGORSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Корт в Парке Притяжение' AND "regionId" = r."id");

-- === Владикавказ (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bajada Padel Club', 'Владикавказ', r."id", 1, false
FROM "Region" r WHERE r."code" = 'VLADIKAVKAZ'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bajada Padel Club' AND "regionId" = r."id");

-- === Саранск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Saransk', 'Саранск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SARANSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Saransk' AND "regionId" = r."id");

-- === Анапа (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Теннисная академия Барс', 'Анапа', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ANAPA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Теннисная академия Барс' AND "regionId" = r."id");

-- === Ялта (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pallasa', 'Ялта', r."id", 1, false
FROM "Region" r WHERE r."code" = 'YALTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pallasa' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Breeze Royal', 'Ялта', r."id", 1, false
FROM "Region" r WHERE r."code" = 'YALTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Breeze Royal' AND "regionId" = r."id");

-- === Симферополь (2 venues) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Royal Arena', 'Симферополь', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SIMFEROPOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Royal Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Level Padel', 'Симферополь', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SIMFEROPOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Level Padel' AND "regionId" = r."id");

-- === Набережные Челны (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'GazPadel Набережные Челны', 'Набережные Челны', r."id", 1, false
FROM "Region" r WHERE r."code" = 'NAB_CHELNY'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'GazPadel Набережные Челны' AND "regionId" = r."id");

-- === Горно-Алтайск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Altai Palace', 'Горно-Алтайск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'GORNO_ALTAYSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Altai Palace' AND "regionId" = r."id");

-- === Махачкала (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Kubachi Sport Club', 'Махачкала', r."id", 1, false
FROM "Region" r WHERE r."code" = 'MAKHACHKALA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Kubachi Sport Club' AND "regionId" = r."id");

-- === Новочеркасск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Академия тенниса Гранит', 'Новочеркасск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'NOVOCHERKASSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Академия тенниса Гранит' AND "regionId" = r."id");

-- === Тимашевск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Корт на стадионе Колос', 'Тимашевск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'TIMASHEVSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Корт на стадионе Колос' AND "regionId" = r."id");

-- === Светлогорск (1 venue) ===

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Светлогорский теннисный клуб', 'Светлогорск', r."id", 1, false
FROM "Region" r WHERE r."code" = 'SVETLOGORSK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Светлогорский теннисный клуб' AND "regionId" = r."id");
