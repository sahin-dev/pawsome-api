/*
  Warnings:

  - You are about to drop the column `packageId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `feeding_schedule` on the `pets` table. All the data in the column will be lost.
  - Added the required column `petId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `time` on the `bookings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `pets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PetType" AS ENUM ('Dog', 'Cat', 'Bird');

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "packageId",
ADD COLUMN     "petId" INTEGER NOT NULL,
DROP COLUMN "time",
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "pets" DROP COLUMN "feeding_schedule",
ADD COLUMN     "feeding_instructions" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "PetType" NOT NULL,
ALTER COLUMN "medical_notes" DROP NOT NULL,
ALTER COLUMN "behaviour_notes" DROP NOT NULL,
ALTER COLUMN "special_instructions" DROP NOT NULL;

-- CreateTable
CREATE TABLE "gallery" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_pet_id_idx" ON "gallery"("pet_id");

-- CreateIndex
CREATE INDEX "bookings_id_idx" ON "bookings"("id");

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
