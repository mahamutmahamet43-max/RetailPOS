import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  version: string
  timestamp: string
  uptime: number
  database: {
    status: "healthy" | "unhealthy"
    latency: string | null
  }
  environment: string
  responseTime: string
  checks: {
    email: boolean
    auth: boolean
  }
}

export async function GET() {
  const start = Date.now()

  const result: HealthCheck = {
    status: "healthy",
    version: process.env.npm_package_version || "0.1.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: { status: "healthy", latency: null },
    environment: process.env.NODE_ENV || "development",
    responseTime: "",
    checks: { email: false, auth: false },
  }

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    result.database.latency = `${Date.now() - dbStart}ms`
  } catch {
    result.database.status = "unhealthy"
    result.status = "degraded"
  }

  result.checks.auth = !!process.env.AUTH_SECRET && !!process.env.AUTH_URL
  result.checks.email = !!process.env.EMAIL_PROVIDER && !!process.env.EMAIL_FROM_ADDRESS

  if (!result.checks.auth) {
    result.status = "degraded"
  }

  result.responseTime = `${Date.now() - start}ms`

  const httpStatus = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503
  return NextResponse.json(result, { status: httpStatus })
}
