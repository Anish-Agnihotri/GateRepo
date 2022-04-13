/*
  Warnings:

  - Added the required column `readOnly` to the `Gate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gate" ADD COLUMN     "readOnly" BOOLEAN NOT NULL;
