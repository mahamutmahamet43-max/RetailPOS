import { prisma } from "@/lib/prisma"
import { isPharmacyEnabled } from "./store"

export async function getExpiryAlerts(storeId: string, productIds: string[]) {
  if (!(await isPharmacyEnabled(storeId))) {
    return { expired: [], expiring30: [], expiring90: [], healthy: [] }
  }

  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const batches = await prisma.medicineBatch.findMany({
    where: {
      productId: { in: productIds },
      quantity: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
    include: { product: { select: { name: true, form: true, strength: true } } },
  })

  return {
    expired: batches.filter((b) => b.expiryDate < now),
    expiring30: batches.filter((b) => b.expiryDate >= now && b.expiryDate <= in30Days),
    expiring90: batches.filter(
      (b) => b.expiryDate > in30Days && b.expiryDate <= in90Days
    ),
    healthy: batches.filter((b) => b.expiryDate > in90Days),
  }
}

export async function getLowStockAlerts(storeId: string) {
  if (!(await isPharmacyEnabled(storeId))) {
    return { outOfStock: [], critical: [], lowStock: [] }
  }

  const products = await prisma.product.findMany({
    where: { storeId, isActive: true },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      minimumStock: true,
      form: true,
      strength: true,
    },
    orderBy: { name: "asc" },
  })

  return {
    outOfStock: products.filter((p) => p.stockQuantity <= 0),
    critical: products.filter(
      (p) => p.minimumStock > 0 && p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock * 0.5
    ),
    lowStock: products.filter(
      (p) => p.minimumStock > 0 && p.stockQuantity > p.minimumStock * 0.5 && p.stockQuantity <= p.minimumStock
    ),
  }
}

export function getStockStatus(quantity: number, minimumStock: number) {
  if (quantity <= 0) return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-100" }
  if (minimumStock > 0 && quantity <= minimumStock * 0.5)
    return { label: "Critical", color: "text-orange-600", bg: "bg-orange-100" }
  if (minimumStock > 0 && quantity <= minimumStock)
    return { label: "Low Stock", color: "text-amber-600", bg: "bg-amber-100" }
  return { label: "In Stock", color: "text-green-600", bg: "bg-green-100" }
}

export function getExpiryStatus(expiryDate: Date) {
  const now = new Date()
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: "Expired", color: "text-red-600", bg: "bg-red-100" }
  if (diffDays <= 30) return { label: "Expiring Soon", color: "text-orange-600", bg: "bg-orange-100" }
  if (diffDays <= 90) return { label: "Expiring", color: "text-amber-600", bg: "bg-amber-100" }
  return { label: "Valid", color: "text-green-600", bg: "bg-green-100" }
}
