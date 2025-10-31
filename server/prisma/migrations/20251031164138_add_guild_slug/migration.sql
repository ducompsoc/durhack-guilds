/*
  Warnings:

  - A unique constraint covering the columns `[guild_slug]` on the table `Guild` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guild_slug` to the `Guild` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Guild" ADD COLUMN     "guild_slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guild_slug_key" ON "Guild"("guild_slug");
