CREATE TABLE "Subscription" (
"id" TEXT NOT NULL PRIMARY KEY,
"userId" TEXT NOT NULL,
"plan" TEXT NOT NULL DEFAULT 'TRIAL',
"status" TEXT NOT NULL DEFAULT 'ACTIVE',
"provider" TEXT,
"providerCustomerId" TEXT,
"providerSubscriptionId" TEXT,
"trialEndsAt" DATETIME,
"currentPeriodEndsAt" DATETIME,
"cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" DATETIME NOT NULL,
CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX "Subscription_status_currentPeriodEndsAt_idx" ON "Subscription"("status","currentPeriodEndsAt");