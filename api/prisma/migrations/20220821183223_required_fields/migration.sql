/*
  Warnings:

  - You are about to alter the column `content` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1000)` to `Unsupported("VARCHAR(1000)")`.
  - Made the column `id` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "content" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL;
