-- Seed Indonesia regions and venues
-- Country 'ID' already exists from 20260308100000_add_countries migration

-- Jakarta
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('JAKARTA', 'Джакарта', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 1)
ON CONFLICT ("code") DO NOTHING;

-- Tangerang
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('TANGERANG', 'Тангеранг', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 2)
ON CONFLICT ("code") DO NOTHING;

-- Bekasi
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BEKASI', 'Бекаси', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 3)
ON CONFLICT ("code") DO NOTHING;

-- Depok
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('DEPOK', 'Депок', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 4)
ON CONFLICT ("code") DO NOTHING;

-- Bogor
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BOGOR', 'Богор', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 5)
ON CONFLICT ("code") DO NOTHING;

-- Bandung
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BANDUNG', 'Бандунг', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 6)
ON CONFLICT ("code") DO NOTHING;

-- Semarang
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SEMARANG', 'Семаранг', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 7)
ON CONFLICT ("code") DO NOTHING;

-- Yogyakarta
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('YOGYAKARTA', 'Джокьякарта', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 8)
ON CONFLICT ("code") DO NOTHING;

-- Surabaya
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('SURABAYA', 'Сурабая', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 9)
ON CONFLICT ("code") DO NOTHING;

-- Malang
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MALANG', 'Маланг', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 10)
ON CONFLICT ("code") DO NOTHING;

-- Bali
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BALI', 'Бали', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Makassar', 11)
ON CONFLICT ("code") DO NOTHING;

-- Lombok
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('LOMBOK', 'Ломбок', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Makassar', 12)
ON CONFLICT ("code") DO NOTHING;

-- Medan
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MEDAN', 'Медан', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 13)
ON CONFLICT ("code") DO NOTHING;

-- Palembang
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('PALEMBANG', 'Палембанг', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 14)
ON CONFLICT ("code") DO NOTHING;

-- Pekanbaru
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('PEKANBARU', 'Пеканбару', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 15)
ON CONFLICT ("code") DO NOTHING;

-- Batam
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('BATAM', 'Батам', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Jakarta', 16)
ON CONFLICT ("code") DO NOTHING;

-- Makassar
INSERT INTO "Region" ("code", "name", "countryId", "timezone", "sortOrder")
VALUES ('MAKASSAR', 'Макассар', (SELECT "id" FROM "Country" WHERE "code" = 'ID'), 'Asia/Makassar', 17)
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- JAKARTA VENUES (30)
-- =============================================

-- South Jakarta
INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Racquet Padel Club Cilandak', 'Jl. M.P.R. III Dalam No.4, Cilandak Barat', r."id", 8, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Racquet Padel Club Cilandak' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'PadelPro Kemang', 'Jl. Kemang II No. 35, Bangka', r."id", 6, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'PadelPro Kemang' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Smash Padel Simatupang', 'TB Simatupang, Jakarta Selatan', r."id", 7, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Smash Padel Simatupang' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Milo''s Padel Kemang', 'Kemang, Jakarta Selatan', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Milo''s Padel Kemang' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pondok Indah Padel Club', 'Pondok Indah, Jakarta Selatan', r."id", 9, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pondok Indah Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Gandaria Clubhouse', 'Jl. Jatayu No. 5, Kebayoran Lama', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Gandaria Clubhouse' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Basic Padel', 'Senayan, Jakarta Selatan', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Basic Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Futton Padel', 'Jl. Kemajuan No.1, Petukangan', r."id", 3, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Futton Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'UNIPADEL Jakarta', 'Jakarta Selatan', r."id", 3, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'UNIPADEL Jakarta' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Anwa Racquet Club', 'Jakarta Selatan', r."id", 5, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Anwa Racquet Club' AND "regionId" = r."id");

-- West Jakarta
INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Homeground Padel Kedoya', 'Jl. Kedoya Pilar No.7, Kebon Jeruk', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Homeground Padel Kedoya' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'OG Padel', 'Taman Kebon Jeruk Intercon Blok M1', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'OG Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'ACE Padel Club', 'Jl. Panjang No. 7, Kedoya Selatan, Kebon Jeruk', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'ACE Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sunrise Padel', 'Jakarta Barat', r."id", 3, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sunrise Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tangkas Padel', 'Tanjung Duren, Jakarta Barat', r."id", 3, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tangkas Padel' AND "regionId" = r."id");

-- North Jakarta
INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Verde Sports Hub', 'Pantai Indah Kapuk 2, Jakarta Utara', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Verde Sports Hub' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Royale Padel', 'Jl. Danau Agung 2 No.25-27, Sunter Agung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Royale Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'El''s Padel', 'Kelapa Gading, Jakarta Utara', r."id", 6, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'El''s Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Gaskan Arena Premiere', 'Jl. Yos Sudarso No.10, Sunter Jaya', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Gaskan Arena Premiere' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Ocean Padel Kelapa Gading', 'Kelapa Gading, Jakarta Utara', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Ocean Padel Kelapa Gading' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelz Club', 'Kelapa Gading, Jakarta Utara', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelz Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padre Padel Kelapa Gading', 'Pegangsaan Dua, Kelapa Gading', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padre Padel Kelapa Gading' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Racquet Padel Club Gading Nias', 'Apartemen Gading Nias, Jl. Pegangsaan Dua', r."id", 2, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Racquet Padel Club Gading Nias' AND "regionId" = r."id");

-- Central Jakarta
INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'House of Padel', '26th Floor, Agora Mall, Thamrin Nine', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'House of Padel' AND "regionId" = r."id");

-- East Jakarta
INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Star Padel Pulomas', 'Jl. Pulo Mas Barat II No. 69', r."id", 2, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Star Padel Pulomas' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Growth Padel Ciracas', 'Jl. H. Baping No.2, Susukan, Ciracas', r."id", 2, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Growth Padel Ciracas' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pace Padel Club', 'Cipayung, Jakarta Timur', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pace Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Seven Padel', 'Jakarta Timur', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Seven Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Wins Arena Kuningan', 'Kuningan, Jakarta', r."id", 2, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Wins Arena Kuningan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Goedang Sport Centre', 'Jakarta Timur', r."id", 4, true
FROM "Region" r WHERE r."code" = 'JAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Goedang Sport Centre' AND "regionId" = r."id");

-- =============================================
-- TANGERANG VENUES (16)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Racquet Padel Club BSD', 'Jl. Raya Pagedangan, BSD', r."id", 5, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Racquet Padel Club BSD' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Smash Padel BSD', 'Serpong, Tangerang Selatan', r."id", 6, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Smash Padel BSD' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Beyond Padel BSD', 'Jl. Melati VIII No. 7, Jelupang, Serpong Utara', r."id", 5, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Beyond Padel BSD' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Rekket Space Padel Hall', 'Jl. Buaran Raya, Serpong', r."id", 9, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Rekket Space Padel Hall' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'GOAT Arena Bintaro', 'Jl. Pd. Betung Raya No. 9, Bintaro', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'GOAT Arena Bintaro' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Urban Padel Bintaro', 'Bintaro, Tangerang Selatan', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Urban Padel Bintaro' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Centro Padel Bintaro', 'Jl. Taman Makam Bahagia Abri, Bintaro', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Centro Padel Bintaro' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Go Padel BSD', 'Jl. Jatake-Babakan Raya No. 78, Pagedangan', r."id", 5, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Go Padel BSD' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'SERV Padel', 'Jl. Pondok Jagung Timur No. 35B, Serpong Utara', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'SERV Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Mad Padel Club', 'Gading Serpong, Tangerang', r."id", 5, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Mad Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Good Padel Club Alam Sutera', 'Jl. Alam Utama No. Kav. 10, Pinang', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Good Padel Club Alam Sutera' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Powerhouse Padel', 'Alam Sutera, Tangerang', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Powerhouse Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Maison Padel Playcourt', 'Tangerang Selatan', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Maison Padel Playcourt' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Hey Beach Padel Club', 'Alam Sutera, Tangerang', r."id", 4, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Hey Beach Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Lounge KYZN', 'Tangerang', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Lounge KYZN' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'YOPADEL Tangerang', 'Tangerang', r."id", 3, true
FROM "Region" r WHERE r."code" = 'TANGERANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'YOPADEL Tangerang' AND "regionId" = r."id");

-- =============================================
-- BEKASI VENUES (2)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'AF Padel', 'Bekasi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BEKASI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'AF Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Parc by Doogether', 'Grand Galaxy Park, Bekasi', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BEKASI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Parc by Doogether' AND "regionId" = r."id");

-- =============================================
-- DEPOK VENUES (2)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Hillside Padel', 'Depok', r."id", 3, true
FROM "Region" r WHERE r."code" = 'DEPOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Hillside Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Good Padel Club Sawangan', 'Sawangan, Depok', r."id", 2, true
FROM "Region" r WHERE r."code" = 'DEPOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Good Padel Club Sawangan' AND "regionId" = r."id");

-- =============================================
-- BOGOR VENUES (1)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Life Indonesia', 'Bogor', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BOGOR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Life Indonesia' AND "regionId" = r."id");

-- =============================================
-- BANDUNG VENUES (16)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bandung Padel Club', 'Jl. Raya Bojongsoang No. 69A, Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bandung Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Hill', 'Dago, Bandung', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Hill' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Casablanca Padel Club', 'Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Casablanca Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Culture Club (PCC)', 'Jl. Karang Layung No. 6, Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Culture Club (PCC)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Good Padel Club Bandung', 'Ciumbuleuit, Bandung', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Good Padel Club Bandung' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Co.', 'Kiara Artha Park, Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Co.' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Six Points Club', 'Jl. Soekarno-Hatta No. 287, Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Six Points Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'South Padel Club', 'Jl. Mekar Sejahtera No. 8, Bandung', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'South Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sportive Hub', 'Jl. Setraduta No. 66B, Bandung', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sportive Hub' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'De Primera Padel Club', 'Festival Citylink Mall, Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'De Primera Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Deruzzi Padel', 'Dago, Bandung', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Deruzzi Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Papadelulu', 'Jl. Soekarno-Hatta No. 7, Bandung', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Papadelulu' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Dadu Padel', 'Bandung', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Dadu Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Lob Padel Haus', 'Bandung', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Lob Padel Haus' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Grand Central Court', 'Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Grand Central Court' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padelon', 'Bandung', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BANDUNG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padelon' AND "regionId" = r."id");

-- =============================================
-- SEMARANG VENUES (2)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Laparaga Sports Club', 'Jl. Puspowarno Sel. V No.26, Semarang Barat', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SEMARANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Laparaga Sports Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Amare Padel Club Papandayan', 'Semarang', r."id", 3, true
FROM "Region" r WHERE r."code" = 'SEMARANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Amare Padel Club Papandayan' AND "regionId" = r."id");

-- =============================================
-- YOGYAKARTA VENUES (9)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Guru Jogjakarta', 'Jl. HOS Cokroaminoto No. 146, Tegalrejo', r."id", 3, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Guru Jogjakarta' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Urban Court YK', 'Sinduadi, Mlati, Sleman', r."id", 3, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Urban Court YK' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Hyena Sports Arena', 'Kledokan, Caturtunggal, Depok, Sleman', r."id", 3, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Hyena Sports Arena' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Arena Jogja', 'North Ring Road, Yogyakarta', r."id", 2, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Arena Jogja' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jogja Padel Spot', 'Yogyakarta', r."id", 1, false
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jogja Padel Spot' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jogja Padel', 'Yogyakarta', r."id", 5, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jogja Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Reds Padel Jogja', 'Jl. Soragan No. 29, Kasihan, Bantul', r."id", 3, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Reds Padel Jogja' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Club Yogyakarta', 'Yogyakarta', r."id", 3, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Club Yogyakarta' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tipsy Tennis Club Jogja', 'Jl. Soragan, Ngestiharjo, Kasihan', r."id", 2, true
FROM "Region" r WHERE r."code" = 'YOGYAKARTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tipsy Tennis Club Jogja' AND "regionId" = r."id");

-- =============================================
-- SURABAYA VENUES (10)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Citraland', 'CBD CF-11, Citraland, Made, Sambikerep', r."id", 13, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Citraland' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Kertajaya', 'Kertajaya Indah Regency, Surabaya', r."id", 6, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Kertajaya' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Graha Padel Club', 'Graha Famili, Surabaya', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Graha Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Uno Padel Babatan', 'Jl. Royal Babatan Utara VII No.25, Wiyung', r."id", 2, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Uno Padel Babatan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Uno Padel Samator', 'Samator Healthphoria, Jl. Raya Kedung Baruk No.26, Rungkut', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Uno Padel Samator' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Playground Padel Club', 'Fairway Nine Mall, Lt. 2, Jl. Mayjend. Jonosewojo No.9', r."id", 2, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Playground Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Margo Sports Center (MSC)', 'Jl. Margomulyo No.20, Greges, Asem Rowo', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Margo Sports Center (MSC)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sports Center Puncak Permai', 'Jl. Raya Darmo Permai III No.80, Dukuhpakis', r."id", 2, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sports Center Puncak Permai' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Homeground Padel Grand Kenjeran', 'Grand Kenjeran, Surabaya Timur', r."id", 6, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Homeground Padel Grand Kenjeran' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel Club Surabaya', 'Surabaya Timur', r."id", 4, true
FROM "Region" r WHERE r."code" = 'SURABAYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel Club Surabaya' AND "regionId" = r."id");

-- =============================================
-- MALANG VENUES (1)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Garden', 'Araya, Malang', r."id", 5, true
FROM "Region" r WHERE r."code" = 'MALANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Garden' AND "regionId" = r."id");

-- =============================================
-- BALI VENUES (32)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bali Padel Academy (BPA)', 'Babakan Kubu, Canggu', r."id", 7, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bali Padel Academy (BPA)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Canggu', 'Raya Canggu, Jl. Sempol', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Canggu' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Pererenan', 'Pererenan, Bali', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Pererenan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Kerobokan', 'Kerobokan, Bali', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Kerobokan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Kedungu', 'Kedungu, Bali', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Kedungu' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Seseh', 'Seseh, Bali', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Seseh' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Canggu Padel', 'Berawa, Canggu', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Canggu Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bali Social Club', 'Jl. Raya Kayu Tulang, Canggu', r."id", 7, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bali Social Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Island Sports Club Canggu', 'Berawa / Tibubeneng, Canggu', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Island Sports Club Canggu' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Island Sports Club Cemagi', 'Jl. Pantai Mengening No.1, Cemagi', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Island Sports Club Cemagi' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Pro Padel Bali', 'Jl. Raya Kerobokan No.264', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Pro Padel Bali' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Amare Padel Bali', 'Jl. Dukuh Indah No.71, Kerobokan Kelod', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Amare Padel Bali' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Liga.Tennis Umalas', 'Umalas, Bali', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Liga.Tennis Umalas' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bam Bam Padel', 'Jl. Cempaka, Mas, Ubud', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bam Bam Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Ubud', 'Jl. Raya Laplapan No.17, Petulu, Ubud', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Ubud' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Monkey Padel Bali', 'Jl. Raya Sayan, Ubud', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Monkey Padel Bali' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel of Gods', 'Jl. Campuhan III, Ubud', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel of Gods' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bisma Padel', 'Bisma, Central Ubud', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bisma Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Island Padel Uluwatu', 'Jl. Labuansait No.250, Pecatu', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Island Padel Uluwatu' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Ground Bali', 'Bingin, Pecatu', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Ground Bali' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Jungle Padel Jimbaran', 'Jimbaran, Bali', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Jungle Padel Jimbaran' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Bali ID', 'Jimbaran, Bali', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Bali ID' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'City Padel Denpasar', 'Denpasar, Bali', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'City Padel Denpasar' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Indo Padel', 'Jl. Teuku Umar Barat No. 88 Z, West Denpasar', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Indo Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Liga.Tennis Sanur', 'Sanur, Bali', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Liga.Tennis Sanur' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sanur Padel Club', 'Jl. Danau Poso No.58, Sanur Kauh', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sanur Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sky Padel Kuta', 'Bali Dynasty Resort, Kuta', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sky Padel Kuta' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bali Sports Club', 'Jl. Grand Dewi Sri, Legian, Kuta', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bali Sports Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Liga.Tennis Seminyak', 'Seminyak, Bali', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Liga.Tennis Seminyak' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Liga Padel Club Nusa Dua', 'Ayodya Resort, Nusa Dua', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Liga Padel Club Nusa Dua' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Liga.Tennis Nusa Dua', 'Hilton Resort, Nusa Dua', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Liga.Tennis Nusa Dua' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Nusa Padel', 'Nusa Dua, Bali', r."id", 3, true
FROM "Region" r WHERE r."code" = 'BALI'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Nusa Padel' AND "regionId" = r."id");

-- =============================================
-- LOMBOK VENUES (4)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'La Reunion Padel Club', 'Kuta, Pujut, Central Lombok', r."id", 6, true
FROM "Region" r WHERE r."code" = 'LOMBOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'La Reunion Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Tampah Padel Club', 'Desa Mekar Sari, Praya Barat, Central Lombok', r."id", 3, true
FROM "Region" r WHERE r."code" = 'LOMBOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Tampah Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Island Padel Gili Trawangan', 'Malibu Beach Club, Jl. Pantai Gili Trawangan', r."id", 3, true
FROM "Region" r WHERE r."code" = 'LOMBOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Island Padel Gili Trawangan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Gili Air', 'Gili Air', r."id", 1, false
FROM "Region" r WHERE r."code" = 'LOMBOK'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Gili Air' AND "regionId" = r."id");

-- =============================================
-- MEDAN VENUES (6)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Kin Urban Ground', 'Jl. Williem Iskandar No.231 B, Medan', r."id", 9, true
FROM "Region" r WHERE r."code" = 'MEDAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Kin Urban Ground' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel People Medan', 'Jl. HM. Said No. 8, Medan', r."id", 4, true
FROM "Region" r WHERE r."code" = 'MEDAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel People Medan' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Medan Padel Club', 'Medan', r."id", 4, true
FROM "Region" r WHERE r."code" = 'MEDAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Medan Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Medanpadel (Gor Anugrah)', 'Gor Anugrah, Medan', r."id", 3, true
FROM "Region" r WHERE r."code" = 'MEDAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Medanpadel (Gor Anugrah)' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'STC Pink Court', 'Jl. Sempurna No.192A, Sudirejo I, Medan Kota', r."id", 2, true
FROM "Region" r WHERE r."code" = 'MEDAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'STC Pink Court' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Total Fit Camp', 'Jl. Sei Belutu No.101, Tj. Rejo, Medan Sunggal', r."id", 2, true
FROM "Region" r WHERE r."code" = 'MEDAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Total Fit Camp' AND "regionId" = r."id");

-- =============================================
-- PALEMBANG VENUES (2)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Next Padel Palembang', 'Jl. Talang Keramat, Palembang', r."id", 4, true
FROM "Region" r WHERE r."code" = 'PALEMBANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Next Padel Palembang' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Qta.Padel', 'Jl. Proklamasi Blok J-32, Palembang', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PALEMBANG'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Qta.Padel' AND "regionId" = r."id");

-- =============================================
-- PEKANBARU VENUES (2)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Padel Pekanbaru', 'Jl. Soekarno Hatta, Pekanbaru', r."id", 4, true
FROM "Region" r WHERE r."code" = 'PEKANBARU'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Padel Pekanbaru' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Bestpadel Pekanbaru', 'Pekanbaru', r."id", 3, true
FROM "Region" r WHERE r."code" = 'PEKANBARU'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Bestpadel Pekanbaru' AND "regionId" = r."id");

-- =============================================
-- BATAM VENUES (7)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'The Padel House Batam', 'Pasar Botania 2, Jl. Raja Alikelana No.2, Belian', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'The Padel House Batam' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'iPadel Club', 'Rooftop Lt. 5, One Batam Mall, Jl. H. Fisabilillah No.9', r."id", 9, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'iPadel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sol Racquet Club', 'Jl. Pasir Putih No. 8, Sadai, Bengkong', r."id", 5, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sol Racquet Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Seaside Padel Club', 'Batam', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Seaside Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Sukajadi Padel Club', 'Batam', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Sukajadi Padel Club' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Play Padel Batam', 'Batam', r."id", 2, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Play Padel Batam' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Batam Padel Club (BPC)', 'Batam', r."id", 4, true
FROM "Region" r WHERE r."code" = 'BATAM'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Batam Padel Club (BPC)' AND "regionId" = r."id");

-- =============================================
-- MAKASSAR VENUES (5)
-- =============================================

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Alpha Padel', 'Mall Phinisi Point, Makassar', r."id", 4, true
FROM "Region" r WHERE r."code" = 'MAKASSAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Alpha Padel' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Topspin Arena Makassar', 'Tamalate, Makassar', r."id", 5, true
FROM "Region" r WHERE r."code" = 'MAKASSAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Topspin Arena Makassar' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Terra Court Makassar', 'Makassar', r."id", 4, true
FROM "Region" r WHERE r."code" = 'MAKASSAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Terra Court Makassar' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'Super Padel CPI', 'Centerpoint of Indonesia, Jl. Canal Drive No.01, Makassar', r."id", 4, true
FROM "Region" r WHERE r."code" = 'MAKASSAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'Super Padel CPI' AND "regionId" = r."id");

INSERT INTO "Venue" ("name", "address", "regionId", "courts", "multiCourt")
SELECT 'UNIPADEL Makassar', 'Makassar', r."id", 4, true
FROM "Region" r WHERE r."code" = 'MAKASSAR'
AND NOT EXISTS (SELECT 1 FROM "Venue" WHERE "name" = 'UNIPADEL Makassar' AND "regionId" = r."id");
