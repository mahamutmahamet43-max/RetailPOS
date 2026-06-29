import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ users, count: users.length })
}
