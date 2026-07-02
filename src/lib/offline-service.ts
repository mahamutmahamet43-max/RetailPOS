import { db, type OfflineProduct, type OfflineCustomer, type OfflineCategory, type OfflineSetting } from "./db"

export async function cacheProducts(storeId: string) {
  try {
    const res = await fetch(`/api/products?limit=1000&storeId=${storeId}`)
    if (!res.ok) return
    const data = await res.json()
    const products = (data.products || data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode || null,
      sku: p.sku || null,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice || null,
      stockQuantity: p.stockQuantity,
      minimumStock: p.minimumStock,
      unit: p.unit || null,
      categoryId: p.categoryId,
      image: p.image || null,
      isActive: p.isActive ?? true,
      expiryDate: p.expiryDate || null,
      unitName: p.unitName || null,
      syncedAt: Date.now(),
    }))
    await db.products.bulkPut(products)
  } catch {}
}

export async function cacheCustomers(storeId: string) {
  try {
    const res = await fetch(`/api/customers?limit=1000&storeId=${storeId}`)
    if (!res.ok) return
    const data = await res.json()
    const customers = (data.customers || []).map((c: any) => ({
      id: c.id,
      customerCode: c.customerCode,
      firstName: c.firstName,
      lastName: c.lastName || null,
      phone: c.phone,
      email: c.email || null,
      address: c.address || null,
      creditLimit: c.creditLimit,
      currentBalance: c.currentBalance,
      isActive: c.isActive ?? true,
      syncedAt: Date.now(),
    }))
    await db.customers.bulkPut(customers)
  } catch {}
}

export async function cacheCategories(storeId: string) {
  try {
    const res = await fetch(`/api/categories?limit=200&storeId=${storeId}`)
    if (!res.ok) return
    const data = await res.json()
    const categories = (data.categories || data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description || null,
      syncedAt: Date.now(),
    }))
    await db.categories.bulkPut(categories)
  } catch {}
}

export async function cacheSettings(storeId: string) {
  try {
    const res = await fetch(`/api/settings/store`)
    if (!res.ok) return
    const data = await res.json()
    await db.settings.put({
      storeId: data.id,
      name: data.name || "",
      address: data.settings?.address || "",
      phone: data.settings?.phone || "",
      email: data.settings?.email || "",
      currency: data.settings?.currency || "USD",
      syncedAt: Date.now(),
    })
  } catch {}
}

export async function getCachedProducts(search?: string): Promise<OfflineProduct[]> {
  if (search) {
    const q = search.toLowerCase()
    return db.products
      .filter((p): boolean =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode !== null && p.barcode.toLowerCase().includes(q)) ||
        (p.sku !== null && p.sku.toLowerCase().includes(q))
      )
      .toArray()
  }
  return db.products.toArray()
}

export async function getCachedCustomers(search?: string): Promise<OfflineCustomer[]> {
  if (search) {
    const q = search.toLowerCase()
    return db.customers
      .filter((c): boolean =>
        c.firstName.toLowerCase().includes(q) ||
        (c.lastName !== null && c.lastName.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        c.customerCode.toLowerCase().includes(q)
      )
      .toArray()
  }
  return db.customers.toArray()
}

export async function getCachedProductByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
  return db.products.get({ barcode })
}

export async function getCachedCustomer(id: string): Promise<OfflineCustomer | undefined> {
  return db.customers.get(id)
}

export async function getCachedCategories(): Promise<OfflineCategory[]> {
  return db.categories.toArray()
}

export async function getCachedSettings(storeId: string): Promise<OfflineSetting | undefined> {
  return db.settings.get(storeId)
}

export async function refreshCache(storeId: string) {
  await Promise.allSettled([
    cacheProducts(storeId),
    cacheCustomers(storeId),
    cacheCategories(storeId),
    cacheSettings(storeId),
  ])
}
