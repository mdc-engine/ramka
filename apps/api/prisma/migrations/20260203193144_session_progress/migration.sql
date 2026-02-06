-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "completedStageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currentStageId" TEXT;
