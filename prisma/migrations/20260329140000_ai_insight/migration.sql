-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "aiGeneratedText" TEXT,
    "ruleBasedText" TEXT,
    "finalText" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "modelUsed" TEXT,
    "generationTimeMs" INTEGER,
    "aiError" TEXT,
    "smartActionsJson" JSONB,
    "userRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIInsight_userId_assessmentId_idx" ON "AIInsight"("userId", "assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AIInsight_userId_assessmentId_key" ON "AIInsight"("userId", "assessmentId");

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
