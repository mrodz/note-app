/*
  Warnings:

  - Made the column `lastUpdated` on table `Document` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "lastUpdated" SET NOT NULL,
ALTER COLUMN "lastUpdated" SET DEFAULT CURRENT_TIMESTAMP;
