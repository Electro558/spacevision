-- CreateTable
CREATE TABLE "TrainingExample" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "description" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'handcrafted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationCapture" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "conversationHistory" JSONB,
    "toolCalls" JSONB,
    "finalSceneState" JSONB,
    "sceneData" JSONB,
    "modelUsed" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationFeedback" (
    "id" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "thumbs" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDataset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDatasetItem" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "exampleId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingDatasetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FineTuneJob" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "externalJobId" TEXT,
    "modelName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "config" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FineTuneJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingExample_category_idx" ON "TrainingExample"("category");

-- CreateIndex
CREATE INDEX "TrainingExample_approved_idx" ON "TrainingExample"("approved");

-- CreateIndex
CREATE INDEX "TrainingExample_source_idx" ON "TrainingExample"("source");

-- CreateIndex
CREATE INDEX "GenerationCapture_userId_idx" ON "GenerationCapture"("userId");

-- CreateIndex
CREATE INDEX "GenerationCapture_createdAt_idx" ON "GenerationCapture"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationCapture_consentGiven_idx" ON "GenerationCapture"("consentGiven");

-- CreateIndex
CREATE INDEX "GenerationFeedback_rating_idx" ON "GenerationFeedback"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationFeedback_captureId_userId_key" ON "GenerationFeedback"("captureId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingDatasetItem_datasetId_exampleId_key" ON "TrainingDatasetItem"("datasetId", "exampleId");

-- CreateIndex
CREATE INDEX "FineTuneJob_status_idx" ON "FineTuneJob"("status");

-- CreateIndex
CREATE INDEX "FineTuneJob_datasetId_idx" ON "FineTuneJob"("datasetId");

-- AddForeignKey
ALTER TABLE "GenerationCapture" ADD CONSTRAINT "GenerationCapture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationFeedback" ADD CONSTRAINT "GenerationFeedback_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "GenerationCapture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationFeedback" ADD CONSTRAINT "GenerationFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDatasetItem" ADD CONSTRAINT "TrainingDatasetItem_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "TrainingDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDatasetItem" ADD CONSTRAINT "TrainingDatasetItem_exampleId_fkey" FOREIGN KEY ("exampleId") REFERENCES "TrainingExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FineTuneJob" ADD CONSTRAINT "FineTuneJob_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "TrainingDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
