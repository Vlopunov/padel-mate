-- Seed countries near Belarus with Russian-speaking communities
-- Add new countries first, then regions and venues

-- New countries
INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('KZ', 'Казахстан', '🇰🇿', 5)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('GE', 'Грузия', '🇬🇪', 6)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('TR', 'Турция', '🇹🇷', 7)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('RS', 'Сербия', '🇷🇸', 8)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('CY', 'Кипр', '🇨🇾', 9)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('ME', 'Черногория', '🇲🇪', 10)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('AM', 'Армения', '🇦🇲', 11)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('LT', 'Литва', '🇱🇹', 12)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('LV', 'Латвия', '🇱🇻', 13)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('EE', 'Эстония', '🇪🇪', 14)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Country" ("code", "name", "flag", "sortOrder")
VALUES ('TH', 'Таиланд', '🇹🇭', 15)
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- KAZAKHSTAN — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ALMATY', 'Алматы', (SELECT "id" FROM "Country" WHERE "code" = 'KZ'), 'Asia/Almaty', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ASTANA', 'Астана', (SELECT "id" FROM "Country" WHERE "code" = 'KZ'), 'Asia/Almaty', 2)
ON CONFLICT ("code") DO NOTHING;

-- KAZAKHSTAN — Venues

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Almaty', 'Saratovskaya 70, Almaty', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ALMATY'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Almaty' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ADD Padel Indoor Almaty', 'Utepova 2/2, Almaty', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ALMATY'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ADD Padel Indoor Almaty' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ADD Padel Astana', 'Kabanbay Batyr 47/1, Astana', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ASTANA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ADD Padel Astana' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ADD Padel Indoor Astana', 'Tauelsizdik 1B, Astana', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ASTANA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ADD Padel Indoor Astana' AND "regionId" = r."id");

-- =============================================
-- GEORGIA — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TBILISI', 'Тбилиси', (SELECT "id" FROM "Country" WHERE "code" = 'GE'), 'Asia/Tbilisi', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BATUMI', 'Батуми', (SELECT "id" FROM "Country" WHERE "code" = 'GE'), 'Asia/Tbilisi', 2)
ON CONFLICT ("code") DO NOTHING;

-- GEORGIA — Venues (Tbilisi)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Gym Breeze', 'Egnate Ninoshvili str 64, Tbilisi', r."id", 10, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Gym Breeze' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelbade Krtsanisi', '7 Giorgi Guramishvili St, Tbilisi', r."id", 5, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelbade Krtsanisi' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sportscape Padel Courts', 'Mikheil Abramishvili 37, Tbilisi', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sportscape Padel Courts' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Academy Tbilisi', 'Petre Kavtaradze 1 turn, N2, Tbilisi', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Academy Tbilisi' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Island — Expo Park', 'Akaki Tsereteli Avenue 118, Tbilisi', r."id", 2, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Island — Expo Park' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Island — Lisi Lake', '56 Fermtserta St, Tbilisi', r."id", 2, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Island — Lisi Lake' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Club Bade', 'Free University campus, Tbilisi', r."id", 2, true
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Club Bade' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tbilisi Padel', 'Mtatsminda Park, Tbilisi', r."id", 1, false
FROM "Region" r WHERE r."code" = 'TBILISI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tbilisi Padel' AND "regionId" = r."id");

-- GEORGIA — Venues (Batumi)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Port Batumi', 'Tengiz Abuladze Street, Batumi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BATUMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Port Batumi' AND "regionId" = r."id");

-- =============================================
-- TURKEY — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ISTANBUL', 'Стамбул', (SELECT "id" FROM "Country" WHERE "code" = 'TR'), 'Europe/Istanbul', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ANTALYA', 'Анталья', (SELECT "id" FROM "Country" WHERE "code" = 'TR'), 'Europe/Istanbul', 2)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('IZMIR', 'Измир', (SELECT "id" FROM "Country" WHERE "code" = 'TR'), 'Europe/Istanbul', 3)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BODRUM', 'Бодрум', (SELECT "id" FROM "Country" WHERE "code" = 'TR'), 'Europe/Istanbul', 4)
ON CONFLICT ("code") DO NOTHING;

-- TURKEY — Venues (Istanbul)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Istanbul Spor Kulubu', 'Poligon Mah., Poligon Cad. No:14-16/1, Istinye, Sariyer', r."id", 2, true
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Istanbul Spor Kulubu' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel.Istanbul', 'Hacıahmet Mah., Kurtulus Deresi Cad. 23-27, Beyoglu', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel.Istanbul' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Ista Padel', 'Poligon, Istinye, Poligon Cd. No:1/1, Sariyer', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Ista Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel House Istanbul', 'Koza Mah., 1638 Sk., Esenyurt', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel House Istanbul' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Casa Kilyos Padel Club', 'Kilyos, Sariyer, Istanbul', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Casa Kilyos Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padyum Padel', 'Istanbul', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padyum Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Yesilyurt Sports Club', 'Florya, Bakirkoy, Istanbul', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ISTANBUL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Yesilyurt Sports Club' AND "regionId" = r."id");

-- TURKEY — Venues (Antalya)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Antalya Padel Club', 'Zumrutova Mah., Yali Caddesi No:204, Antalya', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ANTALYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Antalya Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Cosmos Sports Center', 'Guzeloba Mah., Yasar Sobutay Bulvari No:32, Muratpasa', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ANTALYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Cosmos Sports Center' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Camp D Padel', 'Altinkale Mah, 4554 Sk. No:10, Dosemealti, Antalya', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ANTALYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Camp D Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Phoenix Padel Club', 'Belek, Antalya', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ANTALYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Phoenix Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'V7Padel', 'Antalya', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ANTALYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'V7Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Alanya Padel Academy', 'Saray, Guzelyali Cd., Alanya', r."id", 3, true
FROM "Region" r WHERE r."code" = 'ANTALYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Alanya Padel Academy' AND "regionId" = r."id");

-- TURKEY — Venues (Izmir)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Orange Padel Club Urla', 'Ataturk Mah., 2190 Sk. No:2A, Urla, Izmir', r."id", 3, true
FROM "Region" r WHERE r."code" = 'IZMIR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Orange Padel Club Urla' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pine Padel Club', 'Buca, Izmir', r."id", 4, true
FROM "Region" r WHERE r."code" = 'IZMIR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pine Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Mavisehir Sports International', 'Mavisehir, 2040 Sk. No:3, Karsiyaka, Izmir', r."id", 3, true
FROM "Region" r WHERE r."code" = 'IZMIR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Mavisehir Sports International' AND "regionId" = r."id");

-- TURKEY — Venues (Bodrum)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tennislife Bodrum', 'Dr. Mumtaz Ataman St, Bodrum', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BODRUM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tennislife Bodrum' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bodrum Tennis Club', 'Kemer Mevki, Ortakent, Bodrum', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BODRUM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bodrum Tennis Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Vogue Hotel Supreme Bodrum', 'Bodrum', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BODRUM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Vogue Hotel Supreme Bodrum' AND "regionId" = r."id");

-- =============================================
-- SERBIA — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BELGRADE', 'Белград', (SELECT "id" FROM "Country" WHERE "code" = 'RS'), 'Europe/Belgrade', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('NOVI_SAD', 'Нови-Сад', (SELECT "id" FROM "Country" WHERE "code" = 'RS'), 'Europe/Belgrade', 2)
ON CONFLICT ("code") DO NOTHING;

-- SERBIA — Venues (Belgrade)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Beogradski Padel Klub (BPK)', 'Zorza Klemansoa 41, Dorcol, Belgrade', r."id", 6, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Beogradski Padel Klub (BPK)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Prime Padel Club — Humska', 'Humska 1, Partizan Stadium, Belgrade', r."id", 6, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Prime Padel Club — Humska' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Prime Padel Club — Kalemegdan', 'Kalemegdan Fortress, Belgrade', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Prime Padel Club — Kalemegdan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Klub Dorcol', 'FK GSP Polet, Dunavska 1b, Belgrade', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Klub Dorcol' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Vamos Padel Serbia', 'Ada Ciganlija bb, Belgrade', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Vamos Padel Serbia' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Riverside Padel Center', 'Ada Huja bb, Belgrade', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Riverside Padel Center' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Centar Srbija — Kosutnjak', 'Kneza Viseslava 72, Belgrade', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Centar Srbija — Kosutnjak' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Loko Padel', 'Lole Ribara 1b, Belgrade', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Loko Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Bros', 'Ada Ciganlija bb, Belgrade', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Bros' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Think Padel', 'Ada Ciganlija 5, Cukarica, Belgrade', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BELGRADE'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Think Padel' AND "regionId" = r."id");

-- SERBIA — Venues (Novi Sad)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Novi Sad', 'Branka Bajica 23, Novi Sad', r."id", 3, true
FROM "Region" r WHERE r."code" = 'NOVI_SAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Novi Sad' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Centar Reket Sportova', 'Novosadskog Sajma 62, Novi Sad', r."id", 3, true
FROM "Region" r WHERE r."code" = 'NOVI_SAD'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Centar Reket Sportova' AND "regionId" = r."id");

-- =============================================
-- CYPRUS — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('LIMASSOL', 'Лимассол', (SELECT "id" FROM "Country" WHERE "code" = 'CY'), 'Asia/Nicosia', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('PAPHOS', 'Пафос', (SELECT "id" FROM "Country" WHERE "code" = 'CY'), 'Asia/Nicosia', 2)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('NICOSIA', 'Никосия', (SELECT "id" FROM "Country" WHERE "code" = 'CY'), 'Asia/Nicosia', 3)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('LARNACA', 'Ларнака', (SELECT "id" FROM "Country" WHERE "code" = 'CY'), 'Asia/Nicosia', 4)
ON CONFLICT ("code") DO NOTHING;

-- CYPRUS — Venues (Limassol)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Green Padel Club', 'Mesologiou, Germasogeia 4046, Limassol', r."id", 6, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Green Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'GoAll Padel Centers Limassol', 'Domnitsas Lanitou Kavpunidou, Limassol', r."id", 5, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'GoAll Padel Centers Limassol' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'NAIS Sports Club', 'Germasogeia, Limassol', r."id", 6, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'NAIS Sports Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Arena Limassol', 'Agios Tychon, Limassol', r."id", 4, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Arena Limassol' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Syndicate', 'Limassol', r."id", 4, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Syndicate' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT '4U Padel', 'Limassol', r."id", 3, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = '4U Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Hub', 'Kato Polemidia, Limassol', r."id", 3, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Hub' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Vyma Padel Arena', 'Limassol', r."id", 3, true
FROM "Region" r WHERE r."code" = 'LIMASSOL'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Vyma Padel Arena' AND "regionId" = r."id");

-- CYPRUS — Venues (Paphos)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Lime Padel Park', 'Geroskipou, Paphos', r."id", 6, true
FROM "Region" r WHERE r."code" = 'PAPHOS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Lime Padel Park' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Wembley Sports Center', 'RC87+CQ, Emba, Paphos', r."id", 5, true
FROM "Region" r WHERE r."code" = 'PAPHOS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Wembley Sports Center' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Paphos Padel Club', 'Paphos', r."id", 4, true
FROM "Region" r WHERE r."code" = 'PAPHOS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Paphos Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Aphrodite Hills Resort', 'Kouklia, Paphos', r."id", 2, true
FROM "Region" r WHERE r."code" = 'PAPHOS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Aphrodite Hills Resort' AND "regionId" = r."id");

-- CYPRUS — Venues (Nicosia)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Park CY', 'Roumelis Street, 2236, Nicosia', r."id", 6, true
FROM "Region" r WHERE r."code" = 'NICOSIA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Park CY' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Mywelpad Nicosia Indoor', 'Violettas 5, Strovolos 2032, Nicosia', r."id", 3, true
FROM "Region" r WHERE r."code" = 'NICOSIA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Mywelpad Nicosia Indoor' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Upadel Club & Academy', 'Latsia, Nicosia', r."id", 3, true
FROM "Region" r WHERE r."code" = 'NICOSIA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Upadel Club & Academy' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'GoAll Padel Centers Nicosia', 'Nicosia', r."id", 4, true
FROM "Region" r WHERE r."code" = 'NICOSIA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'GoAll Padel Centers Nicosia' AND "regionId" = r."id");

-- CYPRUS — Venues (Larnaca)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'PadBox Club Larnaka', 'Livadia, Larnaca', r."id", 4, true
FROM "Region" r WHERE r."code" = 'LARNACA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'PadBox Club Larnaka' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Alpha Padel Club', 'Alpha Sports Centre, Dromolaxia, Larnaca', r."id", 2, true
FROM "Region" r WHERE r."code" = 'LARNACA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Alpha Padel Club' AND "regionId" = r."id");

-- =============================================
-- MONTENEGRO — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('PODGORICA', 'Подгорица', (SELECT "id" FROM "Country" WHERE "code" = 'ME'), 'Europe/Podgorica', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BUDVA', 'Будва', (SELECT "id" FROM "Country" WHERE "code" = 'ME'), 'Europe/Podgorica', 2)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TIVAT', 'Тиват', (SELECT "id" FROM "Country" WHERE "code" = 'ME'), 'Europe/Podgorica', 3)
ON CONFLICT ("code") DO NOTHING;

-- MONTENEGRO — Venues

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Titograd', 'Donja Gorica, Podgorica', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PODGORICA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Titograd' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Olive Padel Club at Maestral Resort', 'Przno, Budva', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BUDVA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Olive Padel Club at Maestral Resort' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Splendid Padel & Tennis Center', 'Splendid Conference & Spa Resort, Becici, Budva', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BUDVA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Splendid Padel & Tennis Center' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Montenegro', 'Donja Lastva, Tivat', r."id", 2, true
FROM "Region" r WHERE r."code" = 'TIVAT'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Montenegro' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Porto Montenegro Padel', 'Porto Montenegro, Tivat', r."id", 2, true
FROM "Region" r WHERE r."code" = 'TIVAT'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Porto Montenegro Padel' AND "regionId" = r."id");

-- =============================================
-- ARMENIA — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('YEREVAN', 'Ереван', (SELECT "id" FROM "Country" WHERE "code" = 'AM'), 'Asia/Yerevan', 1)
ON CONFLICT ("code") DO NOTHING;

-- ARMENIA — Venues

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pame Padel Armenia', '65 Vardanants St, Yerevan', r."id", 2, true
FROM "Region" r WHERE r."code" = 'YEREVAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pame Padel Armenia' AND "regionId" = r."id");

-- =============================================
-- LITHUANIA — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('VILNIUS', 'Вильнюс', (SELECT "id" FROM "Country" WHERE "code" = 'LT'), 'Europe/Vilnius', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KAUNAS', 'Каунас', (SELECT "id" FROM "Country" WHERE "code" = 'LT'), 'Europe/Vilnius', 2)
ON CONFLICT ("code") DO NOTHING;

-- LITHUANIA — Venues (Vilnius)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Mostai Padelio Klubas', 'Savanoriu ave. 178B, Vilnius', r."id", 10, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Mostai Padelio Klubas' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Fanu Padelio Arena Metalo', 'Metalo g. 2, Vilnius', r."id", 10, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Fanu Padelio Arena Metalo' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Fanu Padelio Arena Plunges', 'Plunges g. 4, Vilnius', r."id", 9, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Fanu Padelio Arena Plunges' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Vilnius Padel Arena', 'Oziaruciu g. 3, Avizieniai, Vilnius', r."id", 8, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Vilnius Padel Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Factory', 'Savanoriu ave. 180, Vilnius', r."id", 8, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Factory' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Zirmunu Padelio Arena', 'Zirmunu g. 139, Vilnius', r."id", 5, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Zirmunu Padelio Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'DELFI Sporto Centras', 'Ozo g. 14C, Vilnius', r."id", 6, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'DELFI Sporto Centras' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sky Padel Club', 'Vilnius Outlet, Pilaite, Vilnius', r."id", 4, true
FROM "Region" r WHERE r."code" = 'VILNIUS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sky Padel Club' AND "regionId" = r."id");

-- LITHUANIA — Venues (Kaunas)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tennis Space', 'Kaunas', r."id", 10, true
FROM "Region" r WHERE r."code" = 'KAUNAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tennis Space' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Balcia Padel Hub', 'B. Brazdzionio g. 25, Kaunas', r."id", 5, true
FROM "Region" r WHERE r."code" = 'KAUNAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Balcia Padel Hub' AND "regionId" = r."id");

-- =============================================
-- LATVIA — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('RIGA', 'Рига', (SELECT "id" FROM "Country" WHERE "code" = 'LV'), 'Europe/Riga', 1)
ON CONFLICT ("code") DO NOTHING;

-- LATVIA — Venues

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'MH Padel Club', 'Ulmania parks 2, Kalnini, Marupe, Riga', r."id", 8, true
FROM "Region" r WHERE r."code" = 'RIGA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'MH Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Club Riga K9', 'Kisezera iela 9, Riga', r."id", 8, true
FROM "Region" r WHERE r."code" = 'RIGA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Club Riga K9' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Club Riga Beach Arena', 'Ganibu dambis 20A, Riga', r."id", 4, true
FROM "Region" r WHERE r."code" = 'RIGA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Club Riga Beach Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'MyFitness Saga Padel', 'Riga', r."id", 3, true
FROM "Region" r WHERE r."code" = 'RIGA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'MyFitness Saga Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'VARPU Tennis & Padel Club', 'Varpu Street 17A, Marupe, Riga', r."id", 2, true
FROM "Region" r WHERE r."code" = 'RIGA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'VARPU Tennis & Padel Club' AND "regionId" = r."id");

-- =============================================
-- ESTONIA — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TALLINN', 'Таллин', (SELECT "id" FROM "Country" WHERE "code" = 'EE'), 'Europe/Tallinn', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TARTU', 'Тарту', (SELECT "id" FROM "Country" WHERE "code" = 'EE'), 'Europe/Tallinn', 2)
ON CONFLICT ("code") DO NOTHING;

-- ESTONIA — Venues (Tallinn)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelstar Helme', 'Helme tn 18, Tallinn', r."id", 6, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelstar Helme' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelstar Balta', 'Kopli 3, Tallinn', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelstar Balta' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelstar Telliskivi', 'Telliskivi 60a/5, Tallinn', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelstar Telliskivi' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Arenas Mustamae', 'Akadeemia tee 45, Tallinn', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Arenas Mustamae' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Company Viru Keskus', 'Viru valjak 4, Tallinn', r."id", 2, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Company Viru Keskus' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel+ Rocca al Mare', 'Haabersti tn 5, Tallinn', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel+ Rocca al Mare' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelikeskus', 'Louka tn 10, Tallinn', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelikeskus' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Endover Volta Padel', 'Uus-Volta tn 2, Tallinn', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Endover Volta Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'FV Padel Viimsi', 'Sopruse tee 5, Viimsi, Tallinn', r."id", 7, true
FROM "Region" r WHERE r."code" = 'TALLINN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'FV Padel Viimsi' AND "regionId" = r."id");

-- ESTONIA — Venues (Tartu)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tartu NET Sports Hall', 'Tartu', r."id", 5, true
FROM "Region" r WHERE r."code" = 'TARTU'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tartu NET Sports Hall' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'BioPadel', 'Ravila Street, Tartu', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TARTU'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'BioPadel' AND "regionId" = r."id");

-- =============================================
-- THAILAND — Regions
-- =============================================

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BANGKOK', 'Бангкок', (SELECT "id" FROM "Country" WHERE "code" = 'TH'), 'Asia/Bangkok', 1)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('PHUKET', 'Пхукет', (SELECT "id" FROM "Country" WHERE "code" = 'TH'), 'Asia/Bangkok', 2)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('KOH_SAMUI', 'Ко Самуи', (SELECT "id" FROM "Country" WHERE "code" = 'TH'), 'Asia/Bangkok', 3)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('PATTAYA', 'Паттайя', (SELECT "id" FROM "Country" WHERE "code" = 'TH'), 'Asia/Bangkok', 4)
ON CONFLICT ("code") DO NOTHING;

-- THAILAND — Venues (Bangkok)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Baan Padel / Padelio', 'Bangkok', r."id", 7, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Baan Padel / Padelio' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Kross Padel On Nut', '89 Soi Chinnamat, Phra Khanong Nuea, Bangkok', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Kross Padel On Nut' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Kross Padel Indoor', '135 Ardnarong Rd, Khlong Toei, Bangkok', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Kross Padel Indoor' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pad Thai Padel', '3245 Soi Saen Sabai, Khlong Tan, Khlong Toei, Bangkok', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pad Thai Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bel Club 22', 'Phrom Phong, Bangkok', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bel Club 22' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bangkok Padel', 'Ambassador Hotel, Sukhumvit Soi 11, Bangkok', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bangkok Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Co.', '605, 50 Soi Sawasdi 4, Phra Khanong, Bangkok', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Co.' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Playerbox', '187/27 Soi Chula 28, Banthat Thong Rd, Pathumwan, Bangkok', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BANGKOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Playerbox' AND "regionId" = r."id");

-- THAILAND — Venues (Phuket)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Phuket Blue Tree', '4/2 Sriisoonthorn Rd, Cherngtalay, Phuket', r."id", 6, true
FROM "Region" r WHERE r."code" = 'PHUKET'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Phuket Blue Tree' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Tennis Phuket', 'Kathu, Phuket', r."id", 4, true
FROM "Region" r WHERE r."code" = 'PHUKET'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Tennis Phuket' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Xplore Padel Phuket', '5/30/3 Chao Fah Tawan Tok Rd, Chalong, Phuket', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PHUKET'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Xplore Padel Phuket' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Bay', 'Bang Tao, Phuket', r."id", 4, true
FROM "Region" r WHERE r."code" = 'PHUKET'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Bay' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pro Padel Phuket', 'Jl. Raya Kerobokan, Phuket', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PHUKET'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pro Padel Phuket' AND "regionId" = r."id");

-- THAILAND — Venues (Koh Samui)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Samui', 'Plai Laem / Choengmon, Koh Samui', r."id", 4, true
FROM "Region" r WHERE r."code" = 'KOH_SAMUI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Samui' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Paradise Lamai', 'Center of Lamai, Koh Samui', r."id", 3, true
FROM "Region" r WHERE r."code" = 'KOH_SAMUI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Paradise Lamai' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Tropical', '9 Bangrak, 69, Bo Put, Koh Samui', r."id", 3, true
FROM "Region" r WHERE r."code" = 'KOH_SAMUI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Tropical' AND "regionId" = r."id");

-- THAILAND — Venues (Pattaya)

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pattaya Padel Club', '44 Soi Mabprachun Larng 2, Pong, Bang Lamung, Chon Buri', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PATTAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pattaya Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Play Padel Pattaya', 'Kasetsin Soi 3, Pratumnak, Pattaya', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PATTAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Play Padel Pattaya' AND "regionId" = r."id");
