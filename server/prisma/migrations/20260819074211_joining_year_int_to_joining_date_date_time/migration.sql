/*
  Warnings:

  - You are about to drop the column `joiningYear` on the `Borrower` table. All the data in the column will be lost.
  - Added the required column `joiningDate` to the `Borrower` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Borrower" DROP COLUMN "joiningYear",
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL;
