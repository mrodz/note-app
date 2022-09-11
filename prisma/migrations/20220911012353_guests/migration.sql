-- AlterTable
ALTER TABLE "Document" ADD CONSTRAINT "Document_pkey" PRIMARY KEY ("documentId");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "documentDocumentId" TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "_guest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_guest_AB_unique" ON "_guest"("A", "B");

-- CreateIndex
CREATE INDEX "_guest_B_index" ON "_guest"("B");

-- AddForeignKey
ALTER TABLE "_guest" ADD CONSTRAINT "_guest_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("documentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_guest" ADD CONSTRAINT "_guest_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
