import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"
import { getCurrentStore } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()

  const [users, stores, categories, products, customers, sales] = await Promise.all([
    prisma.user.count({ where: { storeId: store.id } }),
    prisma.store.count({ where: { id: store.id } }),
    prisma.category.count({ where: { storeId: store.id } }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.customer.count({ where: { storeId: store.id } }),
    prisma.sale.count({ where: { storeId: store.id } }),
  ])

  return NextResponse.json({
    users,
    stores,
    categories,
    products,
    customers,
    sales,
  })
}
