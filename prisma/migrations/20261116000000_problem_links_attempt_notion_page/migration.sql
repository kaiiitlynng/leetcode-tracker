-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN "notionPage" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lcNumber" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "leetcodeUrl" TEXT,
    "neetcodeUrl" TEXT,
    "difficulty" TEXT NOT NULL,
    "topics" TEXT NOT NULL DEFAULT '[]',
    "pattern" TEXT,
    "notes" TEXT,
    "lists" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Problem" ("createdAt", "difficulty", "id", "lcNumber", "lists", "notes", "pattern", "slug", "title", "topics", "updatedAt") SELECT "createdAt", "difficulty", "id", "lcNumber", "lists", "notes", "pattern", "slug", "title", "topics", "updatedAt" FROM "Problem";
DROP TABLE "Problem";
ALTER TABLE "new_Problem" RENAME TO "Problem";
CREATE UNIQUE INDEX "Problem_lcNumber_key" ON "Problem"("lcNumber");
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

