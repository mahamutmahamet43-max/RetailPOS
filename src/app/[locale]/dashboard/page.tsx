import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { DashboardPage } from "@/components/dashboard/dashboard-page"

export default async function Dashboard() {
  const t = await getTranslations("dashboard")
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("welcome", { name: session?.user?.name || "User" })}
        </p>
      </div>
      <DashboardPage />
    </div>
  )
}
