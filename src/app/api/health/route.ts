import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  database: {
    status: "healthy" | "unhealthy"
    latency: string | null
  }
}

export async function GET() {
  const result: HealthCheck = {
    status: "healthy",
    database: { status: "healthy", latency: null },
  }

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    result.database.latency = `${Date.now() - dbStart}ms`
  } catch {
    result.database.status = "unhealthy"
    result.status = "degraded"
  }

  const httpStatus = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503
  return NextResponse.json(result, { status: httpStatus })
}
