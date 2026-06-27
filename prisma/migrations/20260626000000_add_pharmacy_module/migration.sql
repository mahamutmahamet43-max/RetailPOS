-- Add pharmacy fields to StoreSetting
ALTER TABLE "StoreSetting" ADD COLUMN IF NOT EXISTS "enablePharmacyModule" BOOLEAN NOT NULL DEFAULT false;

-- Add pharmacy fields to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "genericName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dosage" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "strength" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "form" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "medicineCategory" TEXT;

-- Create enums
DO $$ BEGIN
  CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdjustmentReason" AS ENUM ('DAMAGED', 'EXPIRED', 'STOLEN', 'LOST', 'CORRECTION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create MedicineBatch
CREATE TABLE IF NOT EXISTS "MedicineBatch" (
    id TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "purchasePrice" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION,
    quantity INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineBatch_pkey" PRIMARY KEY (id)
);

-- Create Supplier
CREATE TABLE IF NOT EXISTS "Supplier" (
    id TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY (id)
);

-- Create Purchase
CREATE TABLE IF NOT EXISTS "Purchase" (
    id TEXT NOT NULL,
    "purchaseNumber" TEXT NOT NULL,
    "supplierId" TEXT,
    "supplierName" TEXT NOT NULL,
    notes TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    status "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY (id)
);

-- Create PurchaseItem
CREATE TABLE IF NOT EXISTS "PurchaseItem" (
    id TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "batchId" TEXT,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY (id)
);

-- Create Prescription
CREATE TABLE IF NOT EXISTS "Prescription" (
    id TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "saleId" TEXT,
    "doctorName" TEXT,
    "prescriptionNumber" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY (id)
);

-- Add adjustmentReason and purchaseId to InventoryTransaction
ALTER TABLE "InventoryTransaction" ADD COLUMN IF NOT EXISTS "adjustmentReason" "AdjustmentReason";
ALTER TABLE "InventoryTransaction" ADD COLUMN IF NOT EXISTS "purchaseId" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "MedicineBatch_productId_idx" ON "MedicineBatch"("productId");
CREATE INDEX IF NOT EXISTS "MedicineBatch_expiryDate_idx" ON "MedicineBatch"("expiryDate");
CREATE UNIQUE INDEX IF NOT EXISTS "MedicineBatch_productId_batchNumber_key" ON "MedicineBatch"("productId", "batchNumber");
CREATE INDEX IF NOT EXISTS "Supplier_storeId_idx" ON "Supplier"("storeId");
CREATE INDEX IF NOT EXISTS "Purchase_storeId_createdAt_idx" ON "Purchase"("storeId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_storeId_purchaseNumber_key" ON "Purchase"("storeId", "purchaseNumber");
CREATE INDEX IF NOT EXISTS "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");
CREATE INDEX IF NOT EXISTS "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseItem_batchId_key" ON "PurchaseItem"("batchId");
CREATE INDEX IF NOT EXISTS "Prescription_customerId_idx" ON "Prescription"("customerId");
CREATE INDEX IF NOT EXISTS "Prescription_saleId_idx" ON "Prescription"("saleId");
CREATE INDEX IF NOT EXISTS "Prescription_createdAt_idx" ON "Prescription"("createdAt");
CREATE INDEX IF NOT EXISTS "InventoryTransaction_purchaseId_idx" ON "InventoryTransaction"("purchaseId");

-- Add foreign keys
ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MedicineBatch"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"(id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"(id) ON DELETE SET NULL ON UPDATE CASCADE;
