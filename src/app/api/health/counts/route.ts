import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const [users, stores, categories, products, customers, sales] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.sale.count(),
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
