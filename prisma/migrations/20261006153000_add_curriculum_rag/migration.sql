-- CreateTable
CREATE TABLE "CurriculumChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "semester" TEXT,
    "unit" TEXT,
    "lesson" TEXT,
    "source" TEXT,
    "version" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CurriculumChunk_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "CurriculumChunk_subject_grade_reviewed_idx" ON "CurriculumChunk"("subject", "grade", "reviewed");
CREATE INDEX "CurriculumChunk_version_reviewed_idx" ON "CurriculumChunk"("version", "reviewed");
