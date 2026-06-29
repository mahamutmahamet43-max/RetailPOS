import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  const { id } = await params

  const backup = await prisma.backup.findFirst({
    where: { id, storeId: store.id },
  })

  if (!backup) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 })
  }

  const filename = backup.filename.replace(/\.json$/, "") + ".json"

  return new NextResponse(backup.data, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
