/*
  Warnings:

  - You are about to alter the column `title` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.

*/
-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "title" SET DATA TYPE VARCHAR(64);
