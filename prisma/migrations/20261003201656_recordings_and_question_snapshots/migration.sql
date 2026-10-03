-- CreateTable
CREATE TABLE "ClassRecording" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssessmentAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" REAL NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "questionsSnapshot" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssessmentAttempt" ("assessmentId", "completedAt", "id", "score", "submissionKey", "totalPoints", "totalQuestions", "userId") SELECT "assessmentId", "completedAt", "id", "score", "submissionKey", "totalPoints", "totalQuestions", "userId" FROM "AssessmentAttempt";
DROP TABLE "AssessmentAttempt";
ALTER TABLE "new_AssessmentAttempt" RENAME TO "AssessmentAttempt";
CREATE UNIQUE INDEX "AssessmentAttempt_submissionKey_key" ON "AssessmentAttempt"("submissionKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ClassRecording_classId_idx" ON "ClassRecording"("classId");
