-- AlterTable
ALTER TABLE "User" ADD COLUMN "suspendedUntil" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "NoShowReportStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEMBER_JOINED', 'MEMBER_LEFT', 'DEPARTURE_SOON', 'PARTY_DEPARTED', 'PARTY_SETTLED');

-- CreateTable
CREATE TABLE "PartyReview" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberReview" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoShowReport" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "NoShowReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoShowReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "partyId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartyReview_partyId_reviewerId_key" ON "PartyReview"("partyId", "reviewerId");

-- CreateIndex
CREATE INDEX "PartyReview_partyId_idx" ON "PartyReview"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberReview_partyId_reviewerId_revieweeId_key" ON "MemberReview"("partyId", "reviewerId", "revieweeId");

-- CreateIndex
CREATE INDEX "MemberReview_revieweeId_idx" ON "MemberReview"("revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "NoShowReport_partyId_reporterId_reportedUserId_key" ON "NoShowReport"("partyId", "reporterId", "reportedUserId");

-- CreateIndex
CREATE INDEX "NoShowReport_partyId_reportedUserId_status_idx" ON "NoShowReport"("partyId", "reportedUserId", "status");

-- CreateIndex
CREATE INDEX "UserNotification_userId_read_createdAt_idx" ON "UserNotification"("userId", "read", "createdAt");

-- AddForeignKey
ALTER TABLE "PartyReview" ADD CONSTRAINT "PartyReview_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyReview" ADD CONSTRAINT "PartyReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberReview" ADD CONSTRAINT "MemberReview_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberReview" ADD CONSTRAINT "MemberReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberReview" ADD CONSTRAINT "MemberReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowReport" ADD CONSTRAINT "NoShowReport_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowReport" ADD CONSTRAINT "NoShowReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoShowReport" ADD CONSTRAINT "NoShowReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
