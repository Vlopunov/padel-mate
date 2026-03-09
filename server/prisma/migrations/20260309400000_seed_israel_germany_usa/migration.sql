-- =============================================
-- Seed: Israel, Germany, USA
-- Countries, Regions, Venues
-- =============================================

-- =============================================
-- 1. COUNTRIES
-- =============================================
INSERT INTO "Country" ("name", "code", "flag") VALUES
  ('Израиль', 'IL', '🇮🇱'),
  ('Германия', 'DE', '🇩🇪'),
  ('США', 'US', '🇺🇸')
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- 2. REGIONS — ISRAEL (🇮🇱)
-- =============================================
INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Тель-Авив', 'TEL_AVIV', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Иерусалим', 'JERUSALEM', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Герцлия', 'HERZLIYA', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Нетания', 'NETANYA', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Рамат-Ган', 'RAMAT_GAN', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Кфар-Саба', 'KFAR_SABA', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Ришон-ле-Цион', 'RISHON_LEZION', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Беэр-Шева', 'BEER_SHEVA', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Хайфа', 'HAIFA', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Реховот', 'REHOVOT', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Петах-Тиква', 'PETAH_TIKVA', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Савьон', 'SAVYON', c.id FROM "Country" c WHERE c.code = 'IL'
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- 3. VENUES — ISRAEL
-- =============================================

-- Tel Aviv (Тель-Авив)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Israel (TAU)', 'Chaim Levanon St 60', r.id FROM "Region" r WHERE r.code = 'TEL_AVIV'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Israel (TAU)' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Time Club Tel Aviv', 'HaRav Kosovsky St 69', r.id FROM "Region" r WHERE r.code = 'TEL_AVIV'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Time Club Tel Aviv' AND v."regionId" = r.id);

-- Jerusalem (Иерусалим)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Moadon Padel Jerusalem', 'HaUmman 17, Lev Talpiot', r.id FROM "Region" r WHERE r.code = 'JERUSALEM'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Moadon Padel Jerusalem' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Top Padel Jerusalem', 'Churchill 1, Har HaTsofim', r.id FROM "Region" r WHERE r.code = 'JERUSALEM'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Top Padel Jerusalem' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Israel Tennis Center Jerusalem', 'Avraham Elmaliakh St 1', r.id FROM "Region" r WHERE r.code = 'JERUSALEM'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Israel Tennis Center Jerusalem' AND v."regionId" = r.id);

-- Herzliya (Герцлия)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Steele Tennis & Padel Club', 'Ramat Yam 100', r.id FROM "Region" r WHERE r.code = 'HERZLIYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Steele Tennis & Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Top Padel Herzliya', 'Ramat Yam 100', r.id FROM "Region" r WHERE r.code = 'HERZLIYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Top Padel Herzliya' AND v."regionId" = r.id);

-- Netanya (Нетания)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Top Padel Netanya Poleg', 'Sholamit 3', r.id FROM "Region" r WHERE r.code = 'NETANYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Top Padel Netanya Poleg' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Top Padel Ir Yamim', 'Ben Gurion 170', r.id FROM "Region" r WHERE r.code = 'NETANYA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Top Padel Ir Yamim' AND v."regionId" = r.id);

-- Ramat Gan (Рамат-Ган)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Israel Ramat Gan', 'Peretz Bernstein St 7', r.id FROM "Region" r WHERE r.code = 'RAMAT_GAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Israel Ramat Gan' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Israel Hamaccabiah', 'Kfar HaMaccabiah', r.id FROM "Region" r WHERE r.code = 'RAMAT_GAN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Israel Hamaccabiah' AND v."regionId" = r.id);

-- Kfar Saba (Кфар-Саба)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Country Club Kfar Saba', 'Ben Yehuda St 73', r.id FROM "Region" r WHERE r.code = 'KFAR_SABA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Country Club Kfar Saba' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Isaac Wald Park Padel', 'Kfar Saba Municipal Park', r.id FROM "Region" r WHERE r.code = 'KFAR_SABA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Isaac Wald Park Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'House Padel by Ben Zini', 'Beit Berl area', r.id FROM "Region" r WHERE r.code = 'KFAR_SABA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'House Padel by Ben Zini' AND v."regionId" = r.id);

-- Rishon LeZion (Ришон-ле-Цион)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Israel Family Park', '128 Levi Eshkol St', r.id FROM "Region" r WHERE r.code = 'RISHON_LEZION'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Israel Family Park' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Time Club Rishon', 'Rishon LeZion', r.id FROM "Region" r WHERE r.code = 'RISHON_LEZION'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Time Club Rishon' AND v."regionId" = r.id);

-- Beer Sheva (Беэр-Шева)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Beer Sheva Padel Club', 'Heil Handasa St 1', r.id FROM "Region" r WHERE r.code = 'BEER_SHEVA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Beer Sheva Padel Club' AND v."regionId" = r.id);

-- Haifa (Хайфа)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelNet Nesher', 'Great Shape Country Club, Nesher', r.id FROM "Region" r WHERE r.code = 'HAIFA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelNet Nesher' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Tennis & Education Center Haifa', 'Haifa', r.id FROM "Region" r WHERE r.code = 'HAIFA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Tennis & Education Center Haifa' AND v."regionId" = r.id);

-- Rehovot (Реховот)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sportek Rehovot Padel', 'Sportek Center', r.id FROM "Region" r WHERE r.code = 'REHOVOT'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sportek Rehovot Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Time Club Rehovot', 'Rehovot', r.id FROM "Region" r WHERE r.code = 'REHOVOT'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Time Club Rehovot' AND v."regionId" = r.id);

-- Petah Tikva (Петах-Тиква)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelNet Petah Tikva', 'Grinshpan 8', r.id FROM "Region" r WHERE r.code = 'PETAH_TIKVA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelNet Petah Tikva' AND v."regionId" = r.id);

-- Savyon (Савьон)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Top Padel Savyon', 'Hashikma St 1', r.id FROM "Region" r WHERE r.code = 'SAVYON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Top Padel Savyon' AND v."regionId" = r.id);


-- =============================================
-- 4. REGIONS — GERMANY (🇩🇪)
-- =============================================
INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Берлин', 'BERLIN', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Мюнхен', 'MUNICH', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Гамбург', 'HAMBURG', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Кёльн', 'COLOGNE', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Дюссельдорф', 'DUSSELDORF', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Франкфурт', 'FRANKFURT', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Штутгарт', 'STUTTGART', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Дортмунд', 'DORTMUND', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Лейпциг', 'LEIPZIG', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Ганновер', 'HANNOVER', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Бремен', 'BREMEN', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Нюрнберг', 'NUREMBERG', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Бонн', 'BONN', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Мангейм', 'MANNHEIM', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Карлсруэ', 'KARLSRUHE', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Дрезден', 'DRESDEN', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Висбаден', 'WIESBADEN', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Регенсбург', 'REGENSBURG', c.id FROM "Country" c WHERE c.code = 'DE'
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- 5. VENUES — GERMANY
-- =============================================

-- Berlin (Берлин)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Berlin', 'Wiesenweg 1-4', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Berlin' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel FC (Klopp)', 'Rummelsburg, Spree', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel FC (Klopp)' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'We Are Padel Berlin', 'Konigshorster Str. 11-15', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'We Are Padel Berlin' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'TIO TIO Sports Club', 'Marktstr. 6', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'TIO TIO Sports Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Berlin', 'Mullerstrasse 185', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Berlin' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Club Mitte Charlotte', 'Sophie-Charlotten-Str. 14', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Club Mitte Charlotte' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Birgit Padel Kreuzberg', 'Kreuzberg', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Birgit Padel Kreuzberg' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PSCB Padel Social Club', 'Haberstrasse 18, Neukolln', r.id FROM "Region" r WHERE r.code = 'BERLIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PSCB Padel Social Club' AND v."regionId" = r.id);

-- Munich (Мюнхен)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Tucherpark', 'Am Eisbach 5', r.id FROM "Region" r WHERE r.code = 'MUNICH'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Tucherpark' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity OEZ', 'Pelkovenstrasse 148', r.id FROM "Region" r WHERE r.code = 'MUNICH'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity OEZ' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Seasons Allach', 'Paul-Ehrlich-Weg 6', r.id FROM "Region" r WHERE r.code = 'MUNICH'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Seasons Allach' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Scheck Club Padel', 'Munchner Str. 15, Unterfoehring', r.id FROM "Region" r WHERE r.code = 'MUNICH'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Scheck Club Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padelon Vaterstetten', 'Vaterstetten', r.id FROM "Region" r WHERE r.code = 'MUNICH'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padelon Vaterstetten' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Casa Padel Pineapple Park', 'Munchen', r.id FROM "Region" r WHERE r.code = 'MUNICH'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Casa Padel Pineapple Park' AND v."regionId" = r.id);

-- Hamburg (Гамбург)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Hanse Padel', 'Curslacker Heerweg 265', r.id FROM "Region" r WHERE r.code = 'HAMBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Hanse Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padelon Hamburg', 'Glasshutter Landstrasse 43', r.id FROM "Region" r WHERE r.code = 'HAMBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padelon Hamburg' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Der Club an der Alster', 'Hallerstrasse 91', r.id FROM "Region" r WHERE r.code = 'HAMBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Der Club an der Alster' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'mitte Boutique Padel Cabrio', 'Wandsbeker Zollstrasse 25-29', r.id FROM "Region" r WHERE r.code = 'HAMBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'mitte Boutique Padel Cabrio' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Amigos Hamburg', 'Hamburg', r.id FROM "Region" r WHERE r.code = 'HAMBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Amigos Hamburg' AND v."regionId" = r.id);

-- Cologne (Кёльн)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'padelBOX Koln-Weiden', 'Kronstadter Str. 100', r.id FROM "Region" r WHERE r.code = 'COLOGNE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'padelBOX Koln-Weiden' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'padelBOX Koln-Lovenich', 'Ottostrasse 14', r.id FROM "Region" r WHERE r.code = 'COLOGNE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'padelBOX Koln-Lovenich' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'padelBOX Koln-Widdersdorf', 'Koln-Widdersdorf', r.id FROM "Region" r WHERE r.code = 'COLOGNE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'padelBOX Koln-Widdersdorf' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'The Cube Padel Koln', 'Koln', r.id FROM "Region" r WHERE r.code = 'COLOGNE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'The Cube Padel Koln' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Uni Koln Padel', 'Zulpicher Wall 1', r.id FROM "Region" r WHERE r.code = 'COLOGNE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Uni Koln Padel' AND v."regionId" = r.id);

-- Dusseldorf (Дюссельдорф)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'We Are Padel Dusseldorf', 'Am Gatherhof 57', r.id FROM "Region" r WHERE r.code = 'DUSSELDORF'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'We Are Padel Dusseldorf' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padelon Dusseldorf', 'Diepenstr. 83', r.id FROM "Region" r WHERE r.code = 'DUSSELDORF'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padelon Dusseldorf' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'TG Nord Dusseldorf', 'Neusser Weg 92', r.id FROM "Region" r WHERE r.code = 'DUSSELDORF'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'TG Nord Dusseldorf' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Arena TC Kartause', 'Franz-Rennefeld-Weg 22', r.id FROM "Region" r WHERE r.code = 'DUSSELDORF'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Arena TC Kartause' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'mitte Padel bohler', 'Dusseldorf', r.id FROM "Region" r WHERE r.code = 'DUSSELDORF'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'mitte Padel bohler' AND v."regionId" = r.id);

-- Frankfurt (Франкфурт)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Frankfurt Niddapark', 'Am Ginnheimer Waldchen 1', r.id FROM "Region" r WHERE r.code = 'FRANKFURT'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Frankfurt Niddapark' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Frankfurt', 'Kennedyallee 129', r.id FROM "Region" r WHERE r.code = 'FRANKFURT'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Frankfurt' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sportpark Frankfurt', 'Frankfurt am Main', r.id FROM "Region" r WHERE r.code = 'FRANKFURT'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sportpark Frankfurt' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'The Padellers Dreieich', 'Dreieich', r.id FROM "Region" r WHERE r.code = 'FRANKFURT'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'The Padellers Dreieich' AND v."regionId" = r.id);

-- Stuttgart (Штутгарт)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Battle Stuttgart', 'Adolf-Engster-Weg 10', r.id FROM "Region" r WHERE r.code = 'STUTTGART'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Battle Stuttgart' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Stuttgart HTC', 'Bopseracker 1', r.id FROM "Region" r WHERE r.code = 'STUTTGART'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Stuttgart HTC' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Match Center Filderstadt', 'Mahlestrasse 70, Filderstadt', r.id FROM "Region" r WHERE r.code = 'STUTTGART'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Match Center Filderstadt' AND v."regionId" = r.id);

-- Dortmund (Дортмунд)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Dortmund', 'Bunsen-Kirchhoff-Str. 9', r.id FROM "Region" r WHERE r.code = 'DORTMUND'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Dortmund' AND v."regionId" = r.id);

-- Leipzig (Лейпциг)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Leipzig', 'Franz-Flemming-Str. 3a', r.id FROM "Region" r WHERE r.code = 'LEIPZIG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Leipzig' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'VAMOS Padel Club', 'Gorlitzer Str. 5', r.id FROM "Region" r WHERE r.code = 'LEIPZIG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'VAMOS Padel Club' AND v."regionId" = r.id);

-- Hannover (Ганновер)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'HTV Hannover Padel', 'Bonner Str. 12', r.id FROM "Region" r WHERE r.code = 'HANNOVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'HTV Hannover Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Vinnhorst', 'Vinnhorst', r.id FROM "Region" r WHERE r.code = 'HANNOVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Vinnhorst' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Soccerpark Hannover', 'Lavaterhof 1', r.id FROM "Region" r WHERE r.code = 'HANNOVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Soccerpark Hannover' AND v."regionId" = r.id);

-- Bremen (Бремен)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelBude Bremen', 'Werderstrasse 66', r.id FROM "Region" r WHERE r.code = 'BREMEN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelBude Bremen' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Bremer Hockey-Club Padel', 'Heinrich Baden Weg 25', r.id FROM "Region" r WHERE r.code = 'BREMEN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Bremer Hockey-Club Padel' AND v."regionId" = r.id);

-- Nuremberg (Нюрнберг)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Tennis Nurnberg', 'Club am Marienberg', r.id FROM "Region" r WHERE r.code = 'NUREMBERG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Tennis Nurnberg' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sportpark Nord Nurnberg', 'Nurnberg', r.id FROM "Region" r WHERE r.code = 'NUREMBERG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sportpark Nord Nurnberg' AND v."regionId" = r.id);

-- Bonn (Бонн)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus Bonn', 'Johann-Philipp-Reis-Str. 21, Bornheim', r.id FROM "Region" r WHERE r.code = 'BONN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus Bonn' AND v."regionId" = r.id);

-- Mannheim (Мангейм)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'maba! Padel Mannheim', 'Rhein Neckar Zentrum', r.id FROM "Region" r WHERE r.code = 'MANNHEIM'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'maba! Padel Mannheim' AND v."regionId" = r.id);

-- Karlsruhe (Карлсруэ)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'TC Grotzingen Padel', 'Bruchwaldstrasse 72-74', r.id FROM "Region" r WHERE r.code = 'KARLSRUHE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'TC Grotzingen Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Spvgg Durlach-Aue Padel', 'Erlachseeweg 1', r.id FROM "Region" r WHERE r.code = 'KARLSRUHE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Spvgg Durlach-Aue Padel' AND v."regionId" = r.id);

-- Dresden (Дрезден)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Ostrabeach Padel Dresden', 'Zur Messe 11', r.id FROM "Region" r WHERE r.code = 'DRESDEN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Ostrabeach Padel Dresden' AND v."regionId" = r.id);

-- Wiesbaden (Висбаден)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Wiesbaden', 'Oppelnerstr. 3-5', r.id FROM "Region" r WHERE r.code = 'WIESBADEN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Wiesbaden' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'City Padel Wiesbaden', 'Dotzheimer Str. 170', r.id FROM "Region" r WHERE r.code = 'WIESBADEN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'City Padel Wiesbaden' AND v."regionId" = r.id);

-- Regensburg (Регенсбург)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelCity Regensburg', 'Obertraubling', r.id FROM "Region" r WHERE r.code = 'REGENSBURG'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelCity Regensburg' AND v."regionId" = r.id);


-- =============================================
-- 6. REGIONS — USA (🇺🇸)
-- =============================================
INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Майами', 'MIAMI', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Нью-Йорк', 'NEW_YORK', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Лос-Анджелес', 'LOS_ANGELES', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Хьюстон', 'HOUSTON', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Даллас', 'DALLAS', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Остин', 'AUSTIN', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Сан-Антонио', 'SAN_ANTONIO', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Сан-Диего', 'SAN_DIEGO', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Сан-Франциско', 'SAN_FRANCISCO', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Чикаго', 'CHICAGO', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Денвер', 'DENVER', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Атланта', 'ATLANTA', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Нашвилл', 'NASHVILLE', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Лас-Вегас', 'LAS_VEGAS', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Финикс', 'PHOENIX', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Бостон', 'BOSTON', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Филадельфия', 'PHILADELPHIA', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Region" ("name", "code", "countryId")
SELECT 'Орландо', 'ORLANDO', c.id FROM "Country" c WHERE c.code = 'US'
ON CONFLICT ("code") DO NOTHING;

-- =============================================
-- 7. VENUES — USA
-- =============================================

-- Miami (Майами)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Ultra Padel Club', '6101 NW 74th Ave', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Ultra Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel X Miami', '141 NE 13th Terrace', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel X Miami' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Wynwood Padel Club', 'Wynwood, Miami', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Wynwood Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Reserve Padel MacArthur', 'MacArthur Causeway', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Reserve Padel MacArthur' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Reserve Padel Design District', '123 NE 41st St', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Reserve Padel Design District' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Reserve Padel North Miami', '2201 Sole Mia Way', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Reserve Padel North Miami' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Open Padel Miami', 'Miramar', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Open Padel Miami' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Smart Padel House', 'Miami', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Smart Padel House' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Real Padel Miami', 'Miami', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Real Padel Miami' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sunset Padel', '1880 West Ave, Miami Beach', r.id FROM "Region" r WHERE r.code = 'MIAMI'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sunset Padel' AND v."regionId" = r.id);

-- New York (Нью-Йорк)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus Williamsburg', '307 Kent Ave, Brooklyn', r.id FROM "Region" r WHERE r.code = 'NEW_YORK'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus Williamsburg' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus DUMBO', 'DUMBO, Brooklyn', r.id FROM "Region" r WHERE r.code = 'NEW_YORK'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus DUMBO' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus Greenpoint', 'Greenpoint, Brooklyn', r.id FROM "Region" r WHERE r.code = 'NEW_YORK'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus Greenpoint' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel& Greenpoint', 'Greenpoint, Brooklyn', r.id FROM "Region" r WHERE r.code = 'NEW_YORK'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel& Greenpoint' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Reserve Padel Hudson Yards', 'Hudson Yards, Manhattan', r.id FROM "Region" r WHERE r.code = 'NEW_YORK'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Reserve Padel Hudson Yards' AND v."regionId" = r.id);

-- Los Angeles (Лос-Анджелес)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'The Padel Courts LA', 'West Sunset Blvd', r.id FROM "Region" r WHERE r.code = 'LOS_ANGELES'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'The Padel Courts LA' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Up Century City', '10250 Santa Monica Blvd', r.id FROM "Region" r WHERE r.code = 'LOS_ANGELES'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Up Century City' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Up Culver City', 'Culver City', r.id FROM "Region" r WHERE r.code = 'LOS_ANGELES'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Up Culver City' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Pura Padel Sherman Oaks', '14006 Riverside Dr', r.id FROM "Region" r WHERE r.code = 'LOS_ANGELES'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Pura Padel Sherman Oaks' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Taktika Padel Carson', 'LA Galaxy Park, Carson', r.id FROM "Region" r WHERE r.code = 'LOS_ANGELES'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Taktika Padel Carson' AND v."regionId" = r.id);

-- Houston (Хьюстон)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Cube Padel Houston', '7918 Breen Rd', r.id FROM "Region" r WHERE r.code = 'HOUSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Cube Padel Houston' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'iPadel Houston', '1112 Egypt St', r.id FROM "Region" r WHERE r.code = 'HOUSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'iPadel Houston' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Racket Social Club Willowbrook', 'Willowbrook', r.id FROM "Region" r WHERE r.code = 'HOUSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Racket Social Club Willowbrook' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Country Club Memorial', 'Memorial, Houston', r.id FROM "Region" r WHERE r.code = 'HOUSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Country Club Memorial' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'TEMPO Padel & Pickleball', 'Houston', r.id FROM "Region" r WHERE r.code = 'HOUSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'TEMPO Padel & Pickleball' AND v."regionId" = r.id);

-- Dallas (Даллас)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Kraken Padel Club', '14510 S Josey Ln, Farmers Branch', r.id FROM "Region" r WHERE r.code = 'DALLAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Kraken Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel39 Dallas', 'Dallas', r.id FROM "Region" r WHERE r.code = 'DALLAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel39 Dallas' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Dallas Padel Club', '3000 Belmeade Dr, Carrollton', r.id FROM "Region" r WHERE r.code = 'DALLAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Dallas Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Preston Playhouse', 'North Dallas', r.id FROM "Region" r WHERE r.code = 'DALLAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Preston Playhouse' AND v."regionId" = r.id);

-- Austin (Остин)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Club Austin', '511 Industrial Blvd', r.id FROM "Region" r WHERE r.code = 'AUSTIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Club Austin' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel39 North Austin', 'The Domain area', r.id FROM "Region" r WHERE r.code = 'AUSTIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel39 North Austin' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Dripping Springs Racquet Club', 'Dripping Springs', r.id FROM "Region" r WHERE r.code = 'AUSTIN'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Dripping Springs Racquet Club' AND v."regionId" = r.id);

-- San Antonio (Сан-Антонио)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'The King of Padel SA', 'San Antonio', r.id FROM "Region" r WHERE r.code = 'SAN_ANTONIO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'The King of Padel SA' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'U-Padel Club', '14630 Judson Rd', r.id FROM "Region" r WHERE r.code = 'SAN_ANTONIO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'U-Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Pick and Padel SA', 'San Antonio', r.id FROM "Region" r WHERE r.code = 'SAN_ANTONIO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Pick and Padel SA' AND v."regionId" = r.id);

-- San Diego (Сан-Диего)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel N9NE', 'Sorrento Valley', r.id FROM "Region" r WHERE r.code = 'SAN_DIEGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel N9NE' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Taktika Padel Barnes', '4490 W Point Loma Blvd', r.id FROM "Region" r WHERE r.code = 'SAN_DIEGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Taktika Padel Barnes' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'King of Padel San Diego', 'San Diego', r.id FROM "Region" r WHERE r.code = 'SAN_DIEGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'King of Padel San Diego' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Rancho Valencia Padel', 'Rancho Valencia Resort', r.id FROM "Region" r WHERE r.code = 'SAN_DIEGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Rancho Valencia Padel' AND v."regionId" = r.id);

-- San Francisco (Сан-Франциско)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Bay Padel Treasure Island', '29 Avenue G, Treasure Island', r.id FROM "Region" r WHERE r.code = 'SAN_FRANCISCO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Bay Padel Treasure Island' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Park Padel Embarcadero', 'Embarcadero Plaza', r.id FROM "Region" r WHERE r.code = 'SAN_FRANCISCO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Park Padel Embarcadero' AND v."regionId" = r.id);

-- Chicago (Чикаго)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Union Padel Club', 'West Loop, Chicago', r.id FROM "Region" r WHERE r.code = 'CHICAGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Union Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Cube Padel Chicago', '3900 S Ashland Ave', r.id FROM "Region" r WHERE r.code = 'CHICAGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Cube Padel Chicago' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Alma Padel Glenview', 'Glenview', r.id FROM "Region" r WHERE r.code = 'CHICAGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Alma Padel Glenview' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Clube Mundelein', 'Mundelein', r.id FROM "Region" r WHERE r.code = 'CHICAGO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Clube Mundelein' AND v."regionId" = r.id);

-- Denver (Денвер)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus Denver', '2501 Welton St', r.id FROM "Region" r WHERE r.code = 'DENVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus Denver' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Racket Social Club Denver', 'Englewood', r.id FROM "Region" r WHERE r.code = 'DENVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Racket Social Club Denver' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Denver Racquets Club', '6305 W 6th Ave, Lakewood', r.id FROM "Region" r WHERE r.code = 'DENVER'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Denver Racquets Club' AND v."regionId" = r.id);

-- Atlanta (Атланта)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus Atlanta', '950 W Marietta St NW', r.id FROM "Region" r WHERE r.code = 'ATLANTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus Atlanta' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'ITP Training Academy pATL', '3110 Presidential Dr', r.id FROM "Region" r WHERE r.code = 'ATLANTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'ITP Training Academy pATL' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Racket Social Club Alpharetta', 'Alpharetta', r.id FROM "Region" r WHERE r.code = 'ATLANTA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Racket Social Club Alpharetta' AND v."regionId" = r.id);

-- Nashville (Нашвилл)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Haus Nashville', 'The Gulch, Nashville', r.id FROM "Region" r WHERE r.code = 'NASHVILLE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Haus Nashville' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sensa Padel Nashville', 'Nashville', r.id FROM "Region" r WHERE r.code = 'NASHVILLE'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sensa Padel Nashville' AND v."regionId" = r.id);

-- Las Vegas (Лас-Вегас)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'P1 Padel Las Vegas', '1876 S Buffalo Dr', r.id FROM "Region" r WHERE r.code = 'LAS_VEGAS'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'P1 Padel Las Vegas' AND v."regionId" = r.id);

-- Phoenix (Финикс)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Camelback Padel Club', '4040 E Camelback Rd', r.id FROM "Region" r WHERE r.code = 'PHOENIX'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Camelback Padel Club' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Conquer Padel Tempe', '7760 S Priest Dr, Tempe', r.id FROM "Region" r WHERE r.code = 'PHOENIX'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Conquer Padel Tempe' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PadelAZ Phoenix', 'Phoenix', r.id FROM "Region" r WHERE r.code = 'PHOENIX'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PadelAZ Phoenix' AND v."regionId" = r.id);

-- Boston (Бостон)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Padel Boston Dedham', '220 Rustcraft Rd, Dedham', r.id FROM "Region" r WHERE r.code = 'BOSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Padel Boston Dedham' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sensa Padel Hyde Park', '1 Westinghouse Plaza, Hyde Park', r.id FROM "Region" r WHERE r.code = 'BOSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sensa Padel Hyde Park' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Ballers Boston Seaport', '25 Pier 4 Blvd', r.id FROM "Region" r WHERE r.code = 'BOSTON'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Ballers Boston Seaport' AND v."regionId" = r.id);

-- Philadelphia (Филадельфия)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'VIVA Padel Philadelphia', 'Philadelphia', r.id FROM "Region" r WHERE r.code = 'PHILADELPHIA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'VIVA Padel Philadelphia' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'PADELphia Bala Cynwyd', 'Bala Cynwyd', r.id FROM "Region" r WHERE r.code = 'PHILADELPHIA'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'PADELphia Bala Cynwyd' AND v."regionId" = r.id);

-- Orlando (Орландо)
INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'USTA National Campus Padel', 'Orlando', r.id FROM "Region" r WHERE r.code = 'ORLANDO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'USTA National Campus Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Caribe Royale Padel', 'Orlando', r.id FROM "Region" r WHERE r.code = 'ORLANDO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Caribe Royale Padel' AND v."regionId" = r.id);

INSERT INTO "Venue" ("name", "address", "regionId")
SELECT 'Sodo Padel Orlando', 'Free Kick Orlando', r.id FROM "Region" r WHERE r.code = 'ORLANDO'
AND NOT EXISTS (SELECT 1 FROM "Venue" v WHERE v.name = 'Sodo Padel Orlando' AND v."regionId" = r.id);
