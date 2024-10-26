-- CreateEnum
CREATE TYPE "QRCodes_category" AS ENUM ('workshop', 'sponsor', 'challenge', 'preset');

-- CreateTable
CREATE TABLE "Area" (
    "area_id" SERIAL NOT NULL,
    "megateam_id" INTEGER NOT NULL,
    "area_name" VARCHAR(255) NOT NULL,
    "area_location" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("area_id")
);

-- CreateTable
CREATE TABLE "Megateam" (
    "megateam_id" SERIAL NOT NULL,
    "megateam_name" VARCHAR(255) NOT NULL,
    "megateam_description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Megateam_pkey" PRIMARY KEY ("megateam_id")
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
    "name" VARCHAR(255) NOT NULL,
    "category" "QRCodes_category" NOT NULL DEFAULT 'workshop',
    "payload" UUID NOT NULL,
    "points_value" INTEGER NOT NULL,
    "max_uses" INTEGER,
    "state" BOOLEAN NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "expiry_time" TIMESTAMP(3) NOT NULL,
    "creator_id" UUID NOT NULL,
    "challenge_rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("qr_code_id")
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

-- CreateIndex
CREATE INDEX "Area_megateam_id_idx" ON "Area"("megateam_id");

-- CreateIndex
CREATE INDEX "Point_origin_qr_code_id_idx" ON "Point"("origin_qr_code_id");

-- CreateIndex
CREATE INDEX "Point_redeemer_user_id_idx" ON "Point"("redeemer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_challenge_rank_key" ON "QrCode"("challenge_rank");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_payload_key" ON "QrCode"("payload");

-- CreateIndex
CREATE INDEX "QrCode_creator_id_idx" ON "QrCode"("creator_id");

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

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_megateam_id_fkey" FOREIGN KEY ("megateam_id") REFERENCES "Megateam"("megateam_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_origin_qr_code_id_fkey" FOREIGN KEY ("origin_qr_code_id") REFERENCES "QrCode"("qr_code_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_redeemer_user_id_fkey" FOREIGN KEY ("redeemer_user_id") REFERENCES "User"("keycloak_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("keycloak_user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "Area"("area_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenSet" ADD CONSTRAINT "TokenSet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("keycloak_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
