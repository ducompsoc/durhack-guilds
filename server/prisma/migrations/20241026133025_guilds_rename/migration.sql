/*
  Warnings:

  - You are about to drop the column `megateam_id` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the `Megateam` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `guild_id` to the `Area` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_megateam_id_fkey";

-- DropIndex
DROP INDEX "Area_megateam_id_idx";

-- AlterTable
ALTER TABLE "Area" DROP COLUMN "megateam_id",
ADD COLUMN     "guild_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Megateam";

-- CreateTable
CREATE TABLE "Guild" (
    "guild_id" SERIAL NOT NULL,
    "guild_name" VARCHAR(255) NOT NULL,
    "guild_description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("guild_id")
);

-- CreateIndex
CREATE INDEX "Area_guild_id_idx" ON "Area"("guild_id");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "Guild"("guild_id") ON DELETE NO ACTION ON UPDATE CASCADE;
