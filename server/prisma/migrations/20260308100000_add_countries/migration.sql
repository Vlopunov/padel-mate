-- CreateTable: Country
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "flag" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- Seed initial countries from existing Region.country values
INSERT INTO "Country" ("code", "name", "flag", "sortOrder") VALUES
    ('BY', 'Беларусь', '🇧🇾', 1),
    ('RU', 'Россия', '🇷🇺', 2),
    ('ID', 'Индонезия', '🇮🇩', 3),
    ('AE', 'ОАЭ', '🇦🇪', 4);

-- Add countryId column to Region
ALTER TABLE "Region" ADD COLUMN "countryId" INTEGER;

-- Populate countryId from existing country string
UPDATE "Region" SET "countryId" = c."id"
FROM "Country" c
WHERE c."code" = "Region"."country";

-- For any regions with unknown country codes, default to BY
UPDATE "Region" SET "countryId" = (SELECT "id" FROM "Country" WHERE "code" = 'BY')
WHERE "countryId" IS NULL;

-- Make countryId NOT NULL
ALTER TABLE "Region" ALTER COLUMN "countryId" SET NOT NULL;

-- Drop old country column
ALTER TABLE "Region" DROP COLUMN "country";

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Region_countryId_idx" ON "Region"("countryId");
