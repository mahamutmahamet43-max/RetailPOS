import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { z } from "zod"
import { validateOrError } from "@/lib/api-validation"

const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required").optional(),
  description: z.string().optional().nullable(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  lowStockAlert: z.boolean().optional(),
  salesNotification: z.boolean().optional(),
  emailNotification: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  enablePharmacyModule: z.boolean().optional(),
})

export async function GET() {
  try {
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const store = await prisma.store.findFirst({
      where: { ownerId: authResult.userId },
      select: {
        name: true,
        description: true,
        settings: {
          select: {
            address: true,
            phone: true,
            email: true,
            currency: true,
            timezone: true,
            dateFormat: true,
            logoUrl: true,
            lowStockAlert: true,
            salesNotification: true,
            emailNotification: true,
            twoFactorEnabled: true,
            enablePharmacyModule: true,
          },
        },
      },
    })

    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    return NextResponse.json({
      name: store.name,
      description: store.description,
      settings: store.settings || {},
    })
  } catch (error) {
    logger.error("GET /api/settings/store error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const body = await request.json()
    const validation = validateOrError(storeSettingsSchema, body)
    if (!validation.success) return validation.response
    const validBody = validation.data

    let store = await prisma.store.findFirst({
      where: { ownerId: authResult.userId },
    })

    if (!store) {
      const slug = (validBody.name || "store")
        .toLowerCase().replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now()

      store = await prisma.store.create({
        data: {
          name: validBody.name || "My Store",
          slug,
          ownerId: authResult.userId,
          subscription: {
            create: {
              plan: "FREE",
              status: "TRIAL",
              startsAt: new Date(),
              trialEndsAt: new Date(Date.now() + 14 * 86400000),
              endsAt: new Date(Date.now() + 14 * 86400000),
            },
          },
        },
      })
    }

    if (validBody.name) {
      await prisma.store.update({
        where: { id: store.id },
        data: { name: validBody.name },
      })
    }

    const stringFields = ["address", "phone", "email", "currency", "timezone", "dateFormat", "logoUrl"] as const
    const boolFields = ["lowStockAlert", "salesNotification", "emailNotification", "twoFactorEnabled", "enablePharmacyModule"] as const

    const settingsData: Record<string, unknown> = {}
    for (const field of stringFields) {
      if (validBody[field as keyof typeof validBody] !== undefined) settingsData[field] = String(validBody[field as keyof typeof validBody])
    }
    for (const field of boolFields) {
      if (validBody[field as keyof typeof validBody] !== undefined) settingsData[field] = Boolean(validBody[field as keyof typeof validBody])
    }

    if (Object.keys(settingsData).length > 0) {
      await prisma.storeSetting.upsert({
        where: { storeId: store.id },
        create: { storeId: store.id, ...settingsData } as any,
        update: settingsData,
      })
    }

    const updated = await prisma.store.findUnique({
      where: { id: store.id },
      select: {
        name: true,
        description: true,
        settings: {
          select: {
            address: true,
            phone: true,
            email: true,
            currency: true,
            timezone: true,
            dateFormat: true,
            logoUrl: true,
            lowStockAlert: true,
            salesNotification: true,
            emailNotification: true,
            twoFactorEnabled: true,
            enablePharmacyModule: true,
          },
        },
      },
    })

    return NextResponse.json({
      name: updated?.name,
      description: updated?.description,
      settings: updated?.settings || {},
    })
  } catch (error) {
    logger.error("PUT /api/settings/store error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
