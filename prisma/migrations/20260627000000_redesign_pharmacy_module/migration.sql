-- DropForeignKey (idempotent: skip if constraint already removed)
DO $$ BEGIN
  ALTER TABLE "MedicineBatch" DROP CONSTRAINT "MedicineBatch_productId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_customerId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_saleId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_batchId_fkey";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- DropIndex (idempotent)
DROP INDEX IF EXISTS "Purchase_storeId_purchaseNumber_key";
DROP INDEX IF EXISTS "PurchaseItem_batchId_key";

-- Rename columns (idempotent: skip if already renamed)
DO $$ BEGIN
  ALTER TABLE "Purchase" RENAME COLUMN "purchaseNumber" TO "invoiceNumber";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Purchase" RENAME COLUMN "totalAmount" TO "total";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "PurchaseItem" RENAME COLUMN "unitCost" TO "costPrice";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- AlterTable: drop removed columns (idempotent)
ALTER TABLE "InventoryTransaction" DROP COLUMN IF EXISTS "adjustmentReason";

ALTER TABLE "Product" DROP COLUMN IF EXISTS "dosage",
DROP COLUMN IF EXISTS "form",
DROP COLUMN IF EXISTS "genericName",
DROP COLUMN IF EXISTS "manufacturer",
DROP COLUMN IF EXISTS "medicineCategory",
DROP COLUMN IF EXISTS "prescriptionRequired",
DROP COLUMN IF EXISTS "strength";

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPharmacyItem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "requiresPrescription" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PurchaseItem" DROP COLUMN IF EXISTS "batchId",
DROP COLUMN IF EXISTS "totalCost";

-- DropTable (idempotent)
DROP TABLE IF EXISTS "MedicineBatch";
DROP TABLE IF EXISTS "Prescription";

-- DropEnum (idempotent)
DROP TYPE IF EXISTS "AdjustmentReason";

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "ProductUnit" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conversionFactor" DECIMAL(65,30) NOT NULL,
    "sellingPrice" DECIMAL(65,30),
    "barcode" TEXT,
    "isBaseUnit" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultSaleUnit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "ProductUnit_productId_idx" ON "ProductUnit"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductUnit_productId_name_key" ON "ProductUnit"("productId", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductUnit_productId_barcode_key" ON "ProductUnit"("productId", "barcode");
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_storeId_invoiceNumber_key" ON "Purchase"("storeId", "invoiceNumber");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  ALTER TABLE "ProductUnit" ADD CONSTRAINT "ProductUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
