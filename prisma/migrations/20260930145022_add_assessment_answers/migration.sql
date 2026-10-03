-- CreateTable
CREATE TABLE "AssessmentAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentAnswer" TEXT,
    "correctAnswer" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswer_attemptId_questionId_key" ON "AssessmentAnswer"("attemptId", "questionId");
