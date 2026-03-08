-- CreateTable: Region
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BY',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Minsk',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- Seed initial regions from old City enum
INSERT INTO "Region" ("code", "name", "country", "timezone", "sortOrder") VALUES
    ('MINSK', 'Минск', 'BY', 'Europe/Minsk', 1),
    ('BREST', 'Брест', 'BY', 'Europe/Minsk', 2),
    ('GRODNO', 'Гродно', 'BY', 'Europe/Minsk', 3);

-- Add regionId to User (nullable first)
ALTER TABLE "User" ADD COLUMN "regionId" INTEGER;

-- Migrate data: city enum -> regionId
UPDATE "User" SET "regionId" = r."id"
FROM "Region" r WHERE r."code" = "User"."city"::TEXT;

-- Drop old city column and index
DROP INDEX IF EXISTS "User_city_idx";
ALTER TABLE "User" DROP COLUMN "city";

-- Add FK constraint
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create new index
CREATE INDEX "User_regionId_idx" ON "User"("regionId");

-- Add regionId + new fields to Venue
ALTER TABLE "Venue" ADD COLUMN "regionId" INTEGER;
ALTER TABLE "Venue" ADD COLUMN "multiCourt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Venue" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Venue" ADD COLUMN "longitude" DOUBLE PRECISION;

-- Migrate venue city -> regionId
UPDATE "Venue" SET "regionId" = r."id"
FROM "Region" r WHERE r."code" = "Venue"."city"::TEXT;

-- Make regionId NOT NULL for Venue (venues always have a region)
ALTER TABLE "Venue" ALTER COLUMN "regionId" SET NOT NULL;

-- Drop old city column and index
DROP INDEX IF EXISTS "Venue_city_idx";
ALTER TABLE "Venue" DROP COLUMN "city";

-- Add FK and index
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Venue_regionId_idx" ON "Venue"("regionId");

-- Add regionId to Tournament
ALTER TABLE "Tournament" ADD COLUMN "regionId" INTEGER;

-- Migrate tournament city -> regionId
UPDATE "Tournament" SET "regionId" = r."id"
FROM "Region" r WHERE r."code" = "Tournament"."city"::TEXT;

-- Make NOT NULL
ALTER TABLE "Tournament" ALTER COLUMN "regionId" SET NOT NULL;

-- Drop old city column
ALTER TABLE "Tournament" DROP COLUMN "city";

-- Add FK and index
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_regionId_fkey"
    FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Tournament_regionId_idx" ON "Tournament"("regionId");

-- Rename cityCounts to regionCounts in DailyStats
ALTER TABLE "DailyStats" RENAME COLUMN "cityCounts" TO "regionCounts";

-- Drop the City enum type
DROP TYPE IF EXISTS "City";
