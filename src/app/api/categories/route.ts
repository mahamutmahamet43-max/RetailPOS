import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, categorySchema } from "@/lib/api-validation"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    logger.error("GET /api/categories error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(categorySchema, body)
    if (!validation.success) return validation.response

    const data = validation.data

    const existing = await prisma.category.findUnique({
      where: { storeId_name: { storeId: store.id, name: data.name.trim() } },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description || null,
        color: data.color || null,
        icon: data.icon || null,
        storeId: store.id,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    logger.error("POST /api/categories error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
