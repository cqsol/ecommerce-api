/*
  Warnings:

  - You are about to drop the column `password` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[supabase_user_id]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supabase_user_id` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "password",
ADD COLUMN     "supabase_user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_supabase_user_id_key" ON "Customer"("supabase_user_id");
