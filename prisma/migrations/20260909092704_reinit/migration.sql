/*
  Warnings:

  - You are about to drop the column `email` on the `Borrower` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Borrower_email_key";

-- AlterTable
ALTER TABLE "Borrower" DROP COLUMN "email";
