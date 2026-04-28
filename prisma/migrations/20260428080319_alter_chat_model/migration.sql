/*
  Warnings:

  - Added the required column `reciever_id` to the `chats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "reciever_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_reciever_id_fkey" FOREIGN KEY ("reciever_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
