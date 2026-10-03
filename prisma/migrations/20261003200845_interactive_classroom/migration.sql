-- CreateTable
CREATE TABLE "ClassPresence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ClassEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "classId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "toUserId" TEXT,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ClassFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassPresence_classId_userId_key" ON "ClassPresence"("classId", "userId");

-- CreateIndex
CREATE INDEX "ClassEvent_classId_id_idx" ON "ClassEvent"("classId", "id");
