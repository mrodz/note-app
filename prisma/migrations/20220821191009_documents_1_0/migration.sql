/*
  Warnings:

  - You are about to alter the column `content` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `VarChar(1000)` to `Unsupported("VARCHAR(1000)")`.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_userId_fkey";

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "content" SET DATA TYPE VARCHAR(1000),
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
