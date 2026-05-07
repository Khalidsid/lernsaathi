-- AlterTable
ALTER TABLE "LearningEvent" ADD COLUMN     "attemptParentEventId" TEXT,
ADD COLUMN     "attemptText" TEXT;

-- CreateIndex
CREATE INDEX "LearningEvent_attemptParentEventId_idx" ON "LearningEvent"("attemptParentEventId");

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_attemptParentEventId_fkey" FOREIGN KEY ("attemptParentEventId") REFERENCES "LearningEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
