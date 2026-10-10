/*
  Warnings:

  - You are about to drop the column `email` on the `Librarian` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Borrower` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Librarian` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Borrower` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Librarian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BORROWER', 'LIBRARIAN');

-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_authorId_fkey";

-- DropIndex
DROP INDEX "Borrowing_bookId_borrowerId_key";

-- DropIndex
DROP INDEX "Librarian_email_key";

-- DropIndex
DROP INDEX "Librarian_name_email_key";

-- AlterTable
ALTER TABLE "Borrower" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Librarian" DROP COLUMN "email",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "role",
ADD COLUMN     "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'BORROWER';

-- CreateIndex
CREATE UNIQUE INDEX "Borrower_userId_key" ON "Borrower"("userId");

-- CreateIndex
CREATE INDEX "Borrowing_bookId_idx" ON "Borrowing"("bookId");

-- CreateIndex
CREATE INDEX "Borrowing_borrowerId_idx" ON "Borrowing"("borrowerId");

-- CreateIndex
CREATE INDEX "Borrowing_librarianId_idx" ON "Borrowing"("librarianId");

-- CreateIndex
CREATE UNIQUE INDEX "Librarian_userId_key" ON "Librarian"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Librarian" ADD CONSTRAINT "Librarian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Borrower" ADD CONSTRAINT "Borrower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
