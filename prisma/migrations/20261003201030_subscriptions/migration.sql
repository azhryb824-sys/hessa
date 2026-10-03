-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "priceHalalas" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amountHalalas" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingInvoice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillingInvoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BillingInvoice_userId_createdAt_idx" ON "BillingInvoice"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_invoiceId_key" ON "Subscription"("invoiceId");

-- CreateIndex
CREATE INDEX "Subscription_userId_expiresAt_idx" ON "Subscription"("userId", "expiresAt");
