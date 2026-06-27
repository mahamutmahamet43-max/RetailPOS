-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "productUnitId" TEXT,
ADD COLUMN     "unitConversionFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "unitName" TEXT NOT NULL DEFAULT 'pcs';

-- CreateIndex
CREATE INDEX "PurchaseItem_productUnitId_idx" ON "PurchaseItem"("productUnitId");

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productUnitId_fkey" FOREIGN KEY ("productUnitId") REFERENCES "ProductUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
