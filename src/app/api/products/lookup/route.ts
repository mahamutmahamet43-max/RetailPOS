import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"

interface LookupResult {
  name: string | null
  brand: string | null
  description: string | null
  image: string | null
  category: string | null
  source: string | null
}

async function lookupLocal(barcode: string, storeId: string): Promise<LookupResult | null> {
  const existing = await prisma.product.findFirst({
    where: { barcode, storeId },
    include: { category: { select: { name: true } } },
  })
  if (!existing) return null
  return {
    name: existing.name,
    brand: existing.brand,
    description: existing.description,
    image: existing.image,
    category: existing.category?.name ?? null,
    source: "local",
  }
}

async function lookupBarcodeOrg(barcode: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(`https://barcodeapi.org/api/auto/${barcode}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.product_name) return null
    return {
      name: data.product_name || null,
      brand: data.brand || null,
      description: data.description || null,
      image: data.image || null,
      category: data.category || null,
      source: "barcodeapi.org",
    }
  } catch {
    return null
  }
}

async function lookupOpenFoodFacts(barcode: string): Promise<LookupResult | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    const p = data.product
    return {
      name: p.product_name || null,
      brand: p.brands || null,
      description: p.generic_name || p.ingredients_text || null,
      image: p.image_url || null,
      category: p.categories?.split(",")[0]?.trim() || null,
      source: "openfoodfacts.org",
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()

    const { barcode } = await request.json()
    if (!barcode || typeof barcode !== "string" || !barcode.trim()) {
      return NextResponse.json({ error: "Barcode is required" }, { status: 400 })
    }

    const cleaned = barcode.trim()

    const local = await lookupLocal(cleaned, store.id)
    if (local) return NextResponse.json(local)

    const ext = (await lookupBarcodeOrg(cleaned)) || (await lookupOpenFoodFacts(cleaned))
    if (ext) return NextResponse.json(ext)

    return NextResponse.json({ error: "Product not found" }, { status: 404 })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
