/*
  Warnings:

  - You are about to drop the column `address` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the `packages` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationUnit` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('PHOTO', 'VIDEO', 'TEXT');

-- DropForeignKey
ALTER TABLE "packages" DROP CONSTRAINT "packages_serviceId_fkey";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "address",
DROP COLUMN "time",
ADD COLUMN     "sitterId" INTEGER;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "duration" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "durationUnit" "DurationUnit" NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "location_lat" DOUBLE PRECISION,
ADD COLUMN     "location_lng" DOUBLE PRECISION;

-- DropTable
DROP TABLE "packages";

-- CreateTable
CREATE TABLE "booking_uploads" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "url" TEXT,
    "text" TEXT,
    "type" "UploadType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_uploads_bookingId_idx" ON "booking_uploads"("bookingId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_uploads" ADD CONSTRAINT "booking_uploads_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
