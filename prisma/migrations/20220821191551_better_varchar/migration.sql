/*
  Warnings:

  - You are about to alter the column `content` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1800)` to `VarChar(1500)`.

*/
-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "content" SET DATA TYPE VARCHAR(1500);
