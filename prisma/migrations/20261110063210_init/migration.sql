-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lcNumber" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topics" TEXT NOT NULL DEFAULT '[]',
    "pattern" TEXT,
    "notes" TEXT,
    "lists" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemId" TEXT NOT NULL,
    "attemptedAt" DATETIME NOT NULL,
    "outcome" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "timeMinutes" INTEGER,
    "language" TEXT,
    "approach" TEXT,
    "timeComplexity" TEXT,
    "spaceComplexity" TEXT,
    "mistakes" TEXT,
    "code" TEXT,
    "isReview" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewState" (
    "problemId" TEXT NOT NULL PRIMARY KEY,
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME NOT NULL,
    "lastReviewedAt" DATETIME,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ReviewState_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_lcNumber_key" ON "Problem"("lcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Attempt_problemId_attemptedAt_idx" ON "Attempt"("problemId", "attemptedAt");
