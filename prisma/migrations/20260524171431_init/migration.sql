-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('CHAKRA', 'PLANETS', 'ELEMENTS', 'LIFE_CHALLENGES', 'OVERALL', 'WEARABLES');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisEntry" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "data" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "pdfStorageUrl" TEXT,
    "qrCodeUrl" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "adminAckSentAt" TIMESTAMP(3),
    "whatsappOpenedAt" TIMESTAMP(3),
    "pdfDownloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_whatsapp_idx" ON "Customer"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisEntry_publicId_key" ON "AnalysisEntry"("publicId");

-- CreateIndex
CREATE INDEX "AnalysisEntry_analysisType_idx" ON "AnalysisEntry"("analysisType");

-- CreateIndex
CREATE INDEX "AnalysisEntry_createdAt_idx" ON "AnalysisEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "AnalysisEntry" ADD CONSTRAINT "AnalysisEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
