import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const users = await prisma.$queryRawUnsafe<Array<{ id: string; email: string; name: string | null; role: string; created_at: Date }>>(
    `SELECT id, email, name, role, created_at FROM "User" ORDER BY created_at ASC`
  )
  return NextResponse.json({ users, count: users.length })
}
