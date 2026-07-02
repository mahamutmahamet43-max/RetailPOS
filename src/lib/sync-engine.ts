import { db } from "./db"

export interface SyncResult {
  synced: number
  conflicted: number
  failed: number
  details: { localId: string; status: string; saleNumber?: string; error?: string }[]
}

export async function processPendingSales(): Promise<SyncResult> {
  const pending = await db.pendingSales.where("status").equals("pending").toArray()
  const result: SyncResult = { synced: 0, conflicted: 0, failed: 0, details: [] }

  for (const sale of pending) {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: sale.data,
      })

      if (res.ok) {
        const serverSale = await res.json()
        await db.pendingSales.update(sale.localId, {
          status: "synced",
          syncedAt: new Date().toISOString(),
          serverSaleId: serverSale.id,
        })
        result.synced++
        result.details.push({ localId: sale.localId, status: "synced", saleNumber: serverSale.saleNumber })
      } else {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }))
        await db.pendingSales.update(sale.localId, {
          status: "conflicted",
          error: errData.error || "Sync failed",
        })
        result.conflicted++
        result.details.push({ localId: sale.localId, status: "conflicted", error: errData.error })
      }
    } catch {
      result.failed++
      result.details.push({ localId: sale.localId, status: "failed", error: "Network error" })
    }
  }

  return result
}

export async function getPendingCount(): Promise<number> {
  return db.pendingSales.where("status").equals("pending").count()
}

export async function getSyncSummary(): Promise<{
  pending: number
  synced: number
  conflicted: number
}> {
  const [pending, synced, conflicted] = await Promise.all([
    db.pendingSales.where("status").equals("pending").count(),
    db.pendingSales.where("status").equals("synced").count(),
    db.pendingSales.where("status").equals("conflicted").count(),
  ])
  return { pending, synced, conflicted }
}

export async function clearSyncedSales() {
  await db.pendingSales.where("status").equals("synced").delete()
}

export async function addPendingSale(localId: string, salePayload: Record<string, unknown>) {
  await db.pendingSales.put({
    localId,
    data: JSON.stringify(salePayload),
    status: "pending",
    createdAt: new Date().toISOString(),
  })
}
