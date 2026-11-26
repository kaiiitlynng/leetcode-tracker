-- A problem can now have several patterns. Copy each existing pattern into the list before dropping the old column.
ALTER TABLE "Problem" ADD COLUMN "patterns" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "Problem" SET "patterns" = ARRAY[btrim("pattern")] WHERE "pattern" IS NOT NULL AND btrim("pattern") <> '';
ALTER TABLE "Problem" DROP COLUMN "pattern";
