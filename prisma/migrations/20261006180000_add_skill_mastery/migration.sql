CREATE TABLE "SkillMastery" (
"id" TEXT NOT NULL PRIMARY KEY,
"userId" TEXT NOT NULL,
"skillId" TEXT NOT NULL,
"attempts" INTEGER NOT NULL DEFAULT 0,
"correctAttempts" INTEGER NOT NULL DEFAULT 0,
"accuracy" REAL NOT NULL DEFAULT 0,
"confidence" REAL NOT NULL DEFAULT 0,
"status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
"lastScore" REAL,
"lastAttemptAt" DATETIME,
"masteredAt" DATETIME,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL,
CONSTRAINT "SkillMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SkillMastery_userId_skillId_key" ON "SkillMastery"("userId","skillId");
CREATE INDEX "SkillMastery_userId_status_idx" ON "SkillMastery"("userId","status");