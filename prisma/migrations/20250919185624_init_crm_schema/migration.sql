-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'SALES', 'SUPPORT', 'READONLY');

-- CreateEnum
CREATE TYPE "public"."DealType" AS ENUM ('NEW_OPPORTUNITY', 'CONFIRMED', 'THIRD_QUOTE', 'UPCOMING');

-- CreateEnum
CREATE TYPE "public"."DealStatus" AS ENUM ('NOT_STARTED', 'PENDING_TO_QUOTE', 'PENDING_VENDOR_QUOTE', 'WAITING_FOR_PO', 'WAITING_FOR_CONFIRMATION', 'IN_PRE_SALES_STAGE');

-- CreateEnum
CREATE TYPE "public"."CommPref" AS ENUM ('WHATSAPP', 'TELEGRAM', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."ParticipantKind" AS ENUM ('VENDOR', 'DISTRIBUTOR', 'SERVICE_PARTNER');

-- CreateEnum
CREATE TYPE "public"."FileLabel" AS ENUM ('Quotes', 'Purchase Orders', 'Agreements', 'Service Reports', 'Handover Reports', 'Delivery Orders', 'Invoices', 'Credit Notes', 'Receipts');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "upn" TEXT NOT NULL,
    "display" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" VARCHAR(7) NOT NULL,
    "address" TEXT,
    "subAddress" TEXT,
    "officeNumber" TEXT,
    "spSiteId" TEXT,
    "spSalesDriveId" TEXT,
    "spProjectsDriveId" TEXT,
    "spFinanceDriveId" TEXT,
    "spBaseFolderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "commPref" "public"."CommPref",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Deal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "projectName" TEXT NOT NULL,
    "type" "public"."DealType" NOT NULL,
    "status" "public"."DealStatus" NOT NULL,
    "ownerUpn" TEXT NOT NULL,
    "estimatedSize" DECIMAL(18,2),
    "spSalesItemId" TEXT,
    "spProjectsItemId" TEXT,
    "spFinanceItemId" TEXT,
    "spWebUrl" TEXT,
    "isLost" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lostReason" TEXT,
    "altOpportunity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Participant" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "kind" "public"."ParticipantKind" NOT NULL,
    "companyName" TEXT NOT NULL,
    "pocName" TEXT,
    "pocContact" TEXT,
    "pocEmail" TEXT,
    "productBrand" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileLink" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "label" "public"."FileLabel" NOT NULL,
    "driveId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "webUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_upn_key" ON "public"."User"("upn");

-- CreateIndex
CREATE UNIQUE INDEX "Company_companyId_key" ON "public"."Company"("companyId");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "public"."Customer"("companyId");

-- CreateIndex
CREATE INDEX "Deal_companyId_idx" ON "public"."Deal"("companyId");

-- CreateIndex
CREATE INDEX "Deal_customerId_idx" ON "public"."Deal"("customerId");

-- CreateIndex
CREATE INDEX "Participant_dealId_idx" ON "public"."Participant"("dealId");

-- CreateIndex
CREATE INDEX "FileLink_dealId_idx" ON "public"."FileLink"("dealId");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Deal" ADD CONSTRAINT "Deal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Participant" ADD CONSTRAINT "Participant_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileLink" ADD CONSTRAINT "FileLink_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "public"."Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
