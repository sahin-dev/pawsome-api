-- DropForeignKey
ALTER TABLE "gallery" DROP CONSTRAINT "gallery_pet_id_fkey";

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
