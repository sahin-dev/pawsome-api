/*
  Warnings:

  - You are about to drop the column `reciever_id` on the `chats` table. All the data in the column will be lost.
  - Added the required column `receiver_id` to the `chats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_reciever_id_fkey";

-- AlterTable
ALTER TABLE "chats" DROP COLUMN "reciever_id",
ADD COLUMN     "receiver_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
