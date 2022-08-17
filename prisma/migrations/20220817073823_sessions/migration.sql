-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
