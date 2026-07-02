import Dexie, { type EntityTable } from "dexie"

export interface OfflineProduct {
  id: string
  name: string
  barcode: string | null
  sku: string | null
  sellingPrice: number
  costPrice: number | null
  stockQuantity: number
  minimumStock: number
  unit: string | null
  categoryId: string
  image: string | null
  isActive: boolean
  expiryDate: string | null
  unitName: string | null
  syncedAt: number
}

export interface OfflineCustomer {
  id: string
  customerCode: string
  firstName: string
  lastName: string | null
  phone: string
  email: string | null
  address: string | null
  creditLimit: number
  currentBalance: number
  isActive: boolean
  syncedAt: number
}

export interface OfflineCategory {
  id: string
  name: string
  description: string | null
  syncedAt: number
}

export interface OfflineSetting {
  storeId: string
  name: string
  address: string
  phone: string
  email: string
  currency: string
  syncedAt: number
}

export interface PendingSale {
  localId: string
  data: string
  status: "pending" | "synced" | "conflicted"
  createdAt: string
  syncedAt?: string
  serverSaleId?: string
  error?: string
}

const db = new Dexie("RetailPOS") as Dexie & {
  products: EntityTable<OfflineProduct, "id">
  customers: EntityTable<OfflineCustomer, "id">
  categories: EntityTable<OfflineCategory, "id">
  settings: EntityTable<OfflineSetting, "storeId">
  pendingSales: EntityTable<PendingSale, "localId">
}

db.version(1).stores({
  products: "id, name, barcode, syncedAt",
  customers: "id, firstName, lastName, phone, syncedAt",
  categories: "id, name, syncedAt",
  settings: "storeId",
  pendingSales: "localId, status, createdAt",
})

export { db }
