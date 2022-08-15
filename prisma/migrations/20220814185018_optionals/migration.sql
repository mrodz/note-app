/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
