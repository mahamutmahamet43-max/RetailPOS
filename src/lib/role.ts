import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function requireRole(
  ...allowedRoles: string[]
): Promise<{ userId: string; role: string } | NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role || "CASHIER"

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions" },
      { status: 403 }
    )
  }

  return { userId: session.user.id, role }
}
