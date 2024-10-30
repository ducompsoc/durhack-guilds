-- CreateEnum
CREATE TYPE "QRCodesCategory" AS ENUM ('workshop', 'sponsor', 'challenge', 'preset');

-- CreateEnum
CREATE TYPE "QuestDependencyMode" AS ENUM ('AND', 'OR');

-- CreateTable
CREATE TABLE "Area" (
    "area_id" SERIAL NOT NULL,
    "guild_id" INTEGER NOT NULL,
    "area_name" VARCHAR(255) NOT NULL,
    "area_location" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("area_id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "guild_id" SERIAL NOT NULL,
    "guild_name" VARCHAR(255) NOT NULL,
    "guild_description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("guild_id")
);

-- CreateTable
CREATE TABLE "Point" (
    "point_id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL,
    "origin_qr_code_id" INTEGER,
    "redeemer_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Point_pkey" PRIMARY KEY ("point_id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "qr_code_id" SERIAL NOT NULL,
    "challenge_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "category" "QRCodesCategory" NOT NULL DEFAULT 'workshop',
    "payload" UUID NOT NULL,
    "points_value" INTEGER NOT NULL,
    "state" BOOLEAN NOT NULL,
    "creator_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "claim_limit" BOOLEAN NOT NULL,
    "is_being_displayed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("qr_code_id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "challenge_id" SERIAL NOT NULL,
    "claim_limit" BOOLEAN NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3),
    "expiry_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category" "QRCodesCategory" NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "quest_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "dependency_mode" "QuestDependencyMode" NOT NULL DEFAULT 'AND',
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("quest_id")
);

-- CreateTable
CREATE TABLE "Team" (
    "team_id" SERIAL NOT NULL,
    "join_code" INTEGER NOT NULL,
    "discord_channel_id" VARCHAR(255),
    "team_name" VARCHAR(255) NOT NULL,
    "area_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("team_id")
);

-- CreateTable
CREATE TABLE "User" (
    "keycloak_user_id" UUID NOT NULL,
    "team_id" INTEGER,
    "initial_login_time" TIMESTAMP(3),
    "last_login_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("keycloak_user_id")
);

-- CreateTable
CREATE TABLE "TokenSet" (
    "user_id" UUID NOT NULL,
    "token_type" TEXT,
    "access_token" TEXT,
    "id_token" TEXT,
    "refresh_token" TEXT,
    "scope" TEXT,
    "access_expiry" TIMESTAMP(0),
    "session_state" TEXT,

    CONSTRAINT "TokenSet_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "SessionRecord" (
    "session_record_id" TEXT NOT NULL,
    "user_id" UUID,
    "data" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionRecord_pkey" PRIMARY KEY ("session_record_id")
);

-- CreateTable
CREATE TABLE "_ChallengeToQuest" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_QuestToUser" (
    "A" INTEGER NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE INDEX "Area_guild_id_idx" ON "Area"("guild_id");

-- CreateIndex
CREATE INDEX "Point_origin_qr_code_id_idx" ON "Point"("origin_qr_code_id");

-- CreateIndex
CREATE INDEX "Point_redeemer_user_id_idx" ON "Point"("redeemer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_payload_key" ON "QrCode"("payload");

-- CreateIndex
CREATE INDEX "QrCode_creator_id_idx" ON "QrCode"("creator_id");

-- CreateIndex
CREATE INDEX "QrCode_challenge_id_idx" ON "QrCode"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "Team_join_code_key" ON "Team"("join_code");

-- CreateIndex
CREATE UNIQUE INDEX "Team_team_name_key" ON "Team"("team_name");

-- CreateIndex
CREATE INDEX "Team_area_id_idx" ON "Team"("area_id");

-- CreateIndex
CREATE INDEX "User_team_id_idx" ON "User"("team_id");

-- CreateIndex
CREATE INDEX "TokenSet_user_id_idx" ON "TokenSet"("user_id");

-- CreateIndex
CREATE INDEX "SessionRecord_user_id_idx" ON "SessionRecord"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "_ChallengeToQuest_AB_unique" ON "_ChallengeToQuest"("A", "B");

-- CreateIndex
CREATE INDEX "_ChallengeToQuest_B_index" ON "_ChallengeToQuest"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_QuestToUser_AB_unique" ON "_QuestToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_QuestToUser_B_index" ON "_QuestToUser"("B");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "Guild"("guild_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_origin_qr_code_id_fkey" FOREIGN KEY ("origin_qr_code_id") REFERENCES "QrCode"("qr_code_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_redeemer_user_id_fkey" FOREIGN KEY ("redeemer_user_id") REFERENCES "User"("keycloak_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("keycloak_user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge"("challenge_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "Area"("area_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSet" ADD CONSTRAINT "TokenSet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("keycloak_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionRecord" ADD CONSTRAINT "SessionRecord_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("keycloak_user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChallengeToQuest" ADD CONSTRAINT "_ChallengeToQuest_A_fkey" FOREIGN KEY ("A") REFERENCES "Challenge"("challenge_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChallengeToQuest" ADD CONSTRAINT "_ChallengeToQuest_B_fkey" FOREIGN KEY ("B") REFERENCES "Quest"("quest_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestToUser" ADD CONSTRAINT "_QuestToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Quest"("quest_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestToUser" ADD CONSTRAINT "_QuestToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("keycloak_user_id") ON DELETE CASCADE ON UPDATE CASCADE;
