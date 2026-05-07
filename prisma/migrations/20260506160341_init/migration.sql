-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "firstLoginAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "displayNamePromptCount" INTEGER NOT NULL DEFAULT 0,
    "preferredExplanationLanguage" TEXT NOT NULL DEFAULT 'roman_hinglish',
    "preferredFormality" TEXT NOT NULL DEFAULT 'aap_formal',
    "englishLevel" TEXT NOT NULL DEFAULT 'weak',
    "formalHindiLevel" TEXT NOT NULL DEFAULT 'weak',
    "germanLevel" TEXT NOT NULL DEFAULT 'A2_B1',
    "examGoalInternal" TEXT NOT NULL DEFAULT 'B1_or_DTZ',
    "showExamLabelsToLearner" BOOLEAN NOT NULL DEFAULT false,
    "mainFears" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredStyle" TEXT NOT NULL DEFAULT 'simple_examples_first',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "taskType" TEXT,
    "hiddenExamRelevance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diagnosis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseDepth" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "learnerVisibleLabel" TEXT NOT NULL,
    "verificationUsed" BOOLEAN NOT NULL DEFAULT false,
    "verificationPrompt" TEXT,
    "learnerResult" TEXT,
    "mistakeCreated" BOOLEAN NOT NULL DEFAULT false,
    "mistakeId" TEXT,
    "uncertaintyFlagged" BOOLEAN NOT NULL DEFAULT false,
    "llmModel" TEXT NOT NULL,
    "llmTokensIn" INTEGER,
    "llmTokensOut" INTEGER,
    "llmLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "mistakeType" TEXT NOT NULL,
    "subtype" TEXT,
    "exampleInput" TEXT NOT NULL,
    "correctForm" TEXT NOT NULL,
    "explanationGiven" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "hiddenExamImpact" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likelyTransferContexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionItem" (
    "id" TEXT NOT NULL,
    "sourceMistakeId" TEXT NOT NULL,
    "revisionType" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "explanation" TEXT,
    "hiddenExamRelevance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learnerVisibleLabel" TEXT NOT NULL DEFAULT 'Wiederholen, was schwer war',
    "nextReview" TIMESTAMP(3) NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 1,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevisionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamReadinessMap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examGoalInternal" TEXT NOT NULL DEFAULT 'B1_or_DTZ',
    "skills" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamReadinessMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_userId_key" ON "LearnerProfile"("userId");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_createdAt_idx" ON "LearningEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Mistake_userId_status_idx" ON "Mistake"("userId", "status");

-- CreateIndex
CREATE INDEX "RevisionItem_nextReview_idx" ON "RevisionItem"("nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "ExamReadinessMap_userId_key" ON "ExamReadinessMap"("userId");

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionItem" ADD CONSTRAINT "RevisionItem_sourceMistakeId_fkey" FOREIGN KEY ("sourceMistakeId") REFERENCES "Mistake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamReadinessMap" ADD CONSTRAINT "ExamReadinessMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
