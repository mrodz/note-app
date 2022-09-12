/*
  Warnings:

  - The primary key for the `Document` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `documentId` on the `Document` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Document` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "_guest" DROP CONSTRAINT "_guest_A_fkey";

-- DropIndex
ALTER TABLE "Document" RENAME COLUMN "documentId" TO id;
-- DROP INDEX "Document_documentId_key";

-- -- AlterTable
-- ALTER TABLE "Document" DROP CONSTRAINT "Document_pkey",
-- DROP COLUMN "documentId",
-- ADD COLUMN     "id" TEXT NOT NULL,
-- ADD CONSTRAINT "Document_pkey" PRIMARY KEY ("id");

-- CreateIndex
-- CREATE UNIQUE INDEX "Document_id_key" ON "Document"("id");

-- AddForeignKey
ALTER TABLE "_guest" ADD CONSTRAINT "_guest_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
