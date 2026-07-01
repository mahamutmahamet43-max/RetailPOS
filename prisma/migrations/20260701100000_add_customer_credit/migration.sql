-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('PAID', 'PARTIALLY_PAID', 'UNPAID');

-- AlterEnum (add CREDIT to PaymentMethod)
ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT';

-- AlterTable (Customer)
ALTER TABLE "Customer" ADD COLUMN "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "totalCreditSales" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "lastPaymentDate" TIMESTAMP(3);

-- AlterTable (Sale)
ALTER TABLE "Sale" ADD COLUMN "creditStatus" "CreditStatus";
ALTER TABLE "Sale" ADD COLUMN "remainingBalance" DOUBLE PRECISION;

-- CreateTable (CustomerPayment)
CREATE TABLE "CustomerPayment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleId" TEXT,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerPayment_customerId_idx" ON "CustomerPayment"("customerId");
CREATE INDEX "CustomerPayment_storeId_createdAt_idx" ON "CustomerPayment"("storeId", "createdAt");

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
