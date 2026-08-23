/*
  Warnings:

  - A unique constraint covering the columns `[name,email]` on the table `Librarian` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Librarian_name_email_key" ON "Librarian"("name", "email");
