-- AlterTable
ALTER TABLE "User" ADD COLUMN     "meshCreditsResetDate" TIMESTAMP(3),
ADD COLUMN     "meshCreditsUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MeshGeneration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'text_to_model',
    "style" TEXT,
    "quality" TEXT NOT NULL DEFAULT 'standard',
    "tripoTaskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultUrl" TEXT,
    "modelData" JSONB,
    "thumbnailUrl" TEXT,
    "polyCount" INTEGER,
    "error" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MeshGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeshGeneration_userId_idx" ON "MeshGeneration"("userId");

-- CreateIndex
CREATE INDEX "MeshGeneration_status_idx" ON "MeshGeneration"("status");

-- CreateIndex
CREATE INDEX "MeshGeneration_createdAt_idx" ON "MeshGeneration"("createdAt");

-- AddForeignKey
ALTER TABLE "MeshGeneration" ADD CONSTRAINT "MeshGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
