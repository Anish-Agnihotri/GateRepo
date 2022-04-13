-- AlterTable
ALTER TABLE "Gate" ADD COLUMN     "dynamicCheck" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "readOnly" SET DEFAULT false;
