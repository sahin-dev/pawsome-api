-- DropForeignKey
ALTER TABLE "pets" DROP CONSTRAINT "pets_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
