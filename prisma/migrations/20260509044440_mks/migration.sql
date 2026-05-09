/*
  Warnings:

  - A unique constraint covering the columns `[dedupeKey]` on the table `Mistake` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceMistakeId]` on the table `RevisionItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LearningEvent" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "Mistake" ADD COLUMN     "dedupeKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowlisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'credentials',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "providerAccountId" TEXT;

-- CreateTable
CREATE TABLE "IdempotencyRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdempotencyRequest_createdAt_idx" ON "IdempotencyRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRequest_userId_route_key_key" ON "IdempotencyRequest"("userId", "route", "key");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_idempotencyKey_idx" ON "LearningEvent"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Mistake_dedupeKey_key" ON "Mistake"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "RevisionItem_sourceMistakeId_key" ON "RevisionItem"("sourceMistakeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_providerAccountId_key" ON "User"("providerAccountId");

-- AddForeignKey
ALTER TABLE "IdempotencyRequest" ADD CONSTRAINT "IdempotencyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
