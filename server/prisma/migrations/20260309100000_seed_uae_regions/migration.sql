-- Seed UAE regions (8 emirates + Al Ain)
-- Country 'AE' already exists from 20260308100000_add_countries migration

-- Dubai
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('DUBAI', 'Дубай', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 1)
ON CONFLICT ("code") DO NOTHING;

-- Abu Dhabi
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('ABU_DHABI', 'Абу-Даби', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 2)
ON CONFLICT ("code") DO NOTHING;

-- Al Ain
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('AL_AIN', 'Аль-Айн', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 3)
ON CONFLICT ("code") DO NOTHING;

-- Sharjah
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SHARJAH', 'Шарджа', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 4)
ON CONFLICT ("code") DO NOTHING;

-- Ajman
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('AJMAN', 'Аджман', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 5)
ON CONFLICT ("code") DO NOTHING;

-- Ras Al Khaimah
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('RAK', 'Рас-эль-Хайма', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 6)
ON CONFLICT ("code") DO NOTHING;

-- Fujairah
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('FUJAIRAH', 'Фуджейра', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 7)
ON CONFLICT ("code") DO NOTHING;

-- Umm Al Quwain
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('UAQ', 'Умм-эль-Кайвайн', (SELECT "id" FROM "Country" WHERE "code" = 'AE'), 'Asia/Dubai', 8)
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- DUBAI VENUES (34)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Central Padel Dubai', 'Al Quoz, Dubai', r."id", 7, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Central Padel Dubai' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'La Cantine Sport Club', 'Bluewaters Island, Dubai', r."id", 6, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'La Cantine Sport Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'SIRO One Za''abeel', 'One Za''abeel, Dubai', r."id", 3, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'SIRO One Za''abeel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Casa Padel', 'Dubai Police Academy, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Casa Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Edition', 'Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Edition' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Just Padel — Mina Rashid', 'Port Rashid / Mina Rashid, Dubai', r."id", 10, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Just Padel — Mina Rashid' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Just Padel — Kite Beach', 'Kite Beach, Dubai', r."id", 2, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Just Padel — Kite Beach' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Just Padel — Dubai South', 'Dubai South, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Just Padel — Dubai South' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Pro — One Central', 'One Central, Dubai', r."id", 5, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Pro — One Central' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Pro — Al Quoz', 'Al Quoz, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Pro — Al Quoz' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Pro — Jumeirah Park', 'Jumeirah Park, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Pro — Jumeirah Park' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Matcha Club — Al Quoz', 'Al Quoz, Dubai', r."id", 6, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Matcha Club — Al Quoz' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Matcha Club — Meydan', 'Meydan, Dubai', r."id", 6, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Matcha Club — Meydan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Kingdom', 'Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Kingdom' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Point', 'Al Quoz, Dubai', r."id", 5, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Point' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'PadelX (Floating Courts)', 'JLT, Cluster I, Dubai', r."id", 2, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'PadelX (Floating Courts)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Club Padel Dubai', 'Al Quoz, Dubai', r."id", 8, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Club Padel Dubai' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Viya Fit', 'Mina Seyahi, Dubai', r."id", 2, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Viya Fit' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Viya Padel', 'Jumeirah Golf Estates, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Viya Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Dubai Creek Golf Club', 'Deira, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Dubai Creek Golf Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Dusit Thani Dubai', 'Sheikh Zayed Road, Dubai', r."id", 2, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Dusit Thani Dubai' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Emirates Golf Club (RRA Padel)', 'Sheikh Zayed Road, Dubai', r."id", 10, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Emirates Golf Club (RRA Padel)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Lob', 'Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Lob' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'World Padel Academy', 'Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'World Padel Academy' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ISD Padel (Inspiratus Sports District)', 'Dubai Sports City, Dubai', r."id", 9, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ISD Padel (Inspiratus Sports District)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Els Club', 'Dubai Sports City, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Els Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Alley', 'Dubai', r."id", 3, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Alley' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Premier Padel', '13 Al Asayel St, Al Quoz Industrial Area 2, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Premier Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Rebound Padel', 'The Sevens Stadium, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Rebound Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Redline Padel — Al Barsha', 'Park 1, Al Barsha 2, Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Redline Padel — Al Barsha' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Redline Factory Padel — Al Quoz', 'Street 27, Al Quoz Industrial Area 4, Dubai', r."id", 5, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Redline Factory Padel — Al Quoz' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Redline Padel — The Greens', 'Zabeel House, The Onyx Tower 3, The Greens, Dubai', r."id", 3, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Redline Padel — The Greens' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Redline Padel — Al Barari', 'Al Barari, Dubai', r."id", 3, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Redline Padel — Al Barari' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelae Dubai', 'Dubai', r."id", 4, true
FROM "Region" r WHERE r."code" = 'DUBAI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelae Dubai' AND "regionId" = r."id");

-- =============================================
-- ABU DHABI VENUES (16)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelae Abu Dhabi', 'Musaffah, Abu Dhabi', r."id", 18, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelae Abu Dhabi' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Let''s Padel Academy', 'Mussafah, Abu Dhabi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Let''s Padel Academy' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Amigos Padel Club', 'Al Bayli 4 Street, Musaffah, Abu Dhabi', r."id", 5, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Amigos Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Abu Dhabi Country Club', 'Abu Dhabi', r."id", 6, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Abu Dhabi Country Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'We Are Padel — Mamsha', 'Mamsha, Abu Dhabi', r."id", 6, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'We Are Padel — Mamsha' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'We Are Padel — Khor Al Maqta', 'Etizan Fitness, Khor Al Maqta, Abu Dhabi', r."id", 6, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'We Are Padel — Khor Al Maqta' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'We Are Padel — Saadiyat', 'Park Hyatt Saadiyat, Abu Dhabi', r."id", 5, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'We Are Padel — Saadiyat' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Viya Padel — Yas Acres', 'Yas Island, Abu Dhabi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Viya Padel — Yas Acres' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Zayed Sports City', 'Abu Dhabi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Zayed Sports City' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Beach Rotana', 'Abu Dhabi Waterfront', r."id", 1, false
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Beach Rotana' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Kingdom Abu Dhabi', 'Downtown Abu Dhabi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Kingdom Abu Dhabi' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Gaby Reca', 'Al Maryah Island, Abu Dhabi', r."id", 7, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Gaby Reca' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Al Forsan International Sports Resort', 'Abu Dhabi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Al Forsan International Sports Resort' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ESS Padel Corniche', 'Radisson Blu Hotel, Corniche Road, Abu Dhabi', r."id", 6, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ESS Padel Corniche' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ESS Padel Saadiyat', 'Park Hyatt Hotel, Saadiyat Island, Abu Dhabi', r."id", 2, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ESS Padel Saadiyat' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Ritz-Carlton Abu Dhabi', 'Grand Canal, Abu Dhabi', r."id", 5, true
FROM "Region" r WHERE r."code" = 'ABU_DHABI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Ritz-Carlton Abu Dhabi' AND "regionId" = r."id");

-- =============================================
-- AL AIN VENUES (3)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'We Are Padel — Al Ain', 'Zakhir, Al Ain', r."id", 6, true
FROM "Region" r WHERE r."code" = 'AL_AIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'We Are Padel — Al Ain' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Emirates Padel — HBZ Stadium', 'Hazza Bin Zayed Stadium, Al Ain', r."id", 5, true
FROM "Region" r WHERE r."code" = 'AL_AIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Emirates Padel — HBZ Stadium' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Zone — Al Ain', 'Al Ain', r."id", 4, true
FROM "Region" r WHERE r."code" = 'AL_AIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Zone — Al Ain' AND "regionId" = r."id");

-- =============================================
-- SHARJAH VENUES (8)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Way', 'Industrial Area 15, Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Way' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'World Padel Academy Sharjah', 'Al Rahmaniya, Shaghrafa 2, Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'World Padel Academy Sharjah' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Space', 'Maleha St, Warehouses Land, Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Space' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Olympia Padel', 'Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Olympia Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Pavilion', 'Sharjah International Cricket Stadium, Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Pavilion' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sharjah Beach Club', 'Beside Sheraton Sharjah Beach Resort, Sharjah', r."id", 2, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sharjah Beach Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Top Padel Sports Club', 'Al Zahia, Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Top Padel Sports Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelae Sharjah', 'Sharjah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SHARJAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelae Sharjah' AND "regionId" = r."id");

-- =============================================
-- AJMAN VENUES (6)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Square', 'Al Jerf Industrial 1, Ajman', r."id", 4, true
FROM "Region" r WHERE r."code" = 'AJMAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Square' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'GoPadel', 'Ajman Aljurf, Ajman', r."id", 3, true
FROM "Region" r WHERE r."code" = 'AJMAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'GoPadel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Fairmont Ajman', 'Fairmont Ajman Hotel, Ajman', r."id", 2, true
FROM "Region" r WHERE r."code" = 'AJMAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Fairmont Ajman' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Corner — Ajman', 'Sheikh Mohammed Bin Rashid St, Al Jerf Industrial 1, Ajman', r."id", 3, true
FROM "Region" r WHERE r."code" = 'AJMAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Corner — Ajman' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Loco', 'Ajman', r."id", 3, true
FROM "Region" r WHERE r."code" = 'AJMAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Loco' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel House Ladies', 'Ajman', r."id", 2, true
FROM "Region" r WHERE r."code" = 'AJMAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel House Ladies' AND "regionId" = r."id");

-- =============================================
-- RAS AL KHAIMAH VENUES (7)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Club', '6 70A St, Al Felyyah, Ras Al Khaimah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Al Hamra Golf Club', 'Al Hamra, Ras Al Khaimah', r."id", 3, true
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Al Hamra Golf Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Ground', 'Khuzam Rd, Al Qurm, Ras Al Khaimah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Ground' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Le Padel', 'Saqer Bin Mohammed Road, Al Felyyah, Ras Al Khaimah', r."id", 3, true
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Le Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Beach Al Hamra', 'Al Hamra Village, Ras Al Khaimah', r."id", 2, true
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Beach Al Hamra' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'DoubleTree by Hilton — Marjan Island', 'Marjan Island, Ras Al Khaimah', r."id", 1, false
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'DoubleTree by Hilton — Marjan Island' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'RAK Hotel Health Club', 'Ras Al Khaimah', r."id", 2, true
FROM "Region" r WHERE r."code" = 'RAK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'RAK Hotel Health Club' AND "regionId" = r."id");

-- =============================================
-- FUJAIRAH VENUES (5)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Corner — Fujairah', 'Al Hail, Fujairah', r."id", 3, true
FROM "Region" r WHERE r."code" = 'FUJAIRAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Corner — Fujairah' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Zone Fujairah', 'Al Hayl Industrial Area, Fujairah', r."id", 4, true
FROM "Region" r WHERE r."code" = 'FUJAIRAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Zone Fujairah' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tennis & Country Club Fujairah', 'Fujairah City Center, Fujairah', r."id", 2, true
FROM "Region" r WHERE r."code" = 'FUJAIRAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tennis & Country Club Fujairah' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Shot', '3994+V43, Al Mughaider, Fujairah', r."id", 2, true
FROM "Region" r WHERE r."code" = 'FUJAIRAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Shot' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'WPA Khor Fakkan', 'Khor Fakkan, Fujairah', r."id", 3, true
FROM "Region" r WHERE r."code" = 'FUJAIRAH'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'WPA Khor Fakkan' AND "regionId" = r."id");

-- =============================================
-- UMM AL QUWAIN VENUES (3)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Corner UAQ', 'Al Shuwaib, Umm Al Quwain Rd, Falaj Al Sheikh, UAQ', r."id", 1, false
FROM "Region" r WHERE r."code" = 'UAQ'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Corner UAQ' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Mangrove Padel Tennis Court', 'Umm Al Quwain', r."id", 2, true
FROM "Region" r WHERE r."code" = 'UAQ'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Mangrove Padel Tennis Court' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'UAQ Beach Padel', 'Umm Al Quwain Beach', r."id", 1, false
FROM "Region" r WHERE r."code" = 'UAQ'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'UAQ Beach Padel' AND "regionId" = r."id");
