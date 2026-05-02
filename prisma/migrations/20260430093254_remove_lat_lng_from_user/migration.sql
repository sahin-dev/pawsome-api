/*
  Warnings:

  - You are about to drop the column `location_lat` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location_lng` on the `users` table. All the data in the column will be lost.
  - Added the required column `address` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "location_lat",
DROP COLUMN "location_lng";
