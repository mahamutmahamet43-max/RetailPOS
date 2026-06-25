import { useTranslations } from "next-intl"
import { InventoryPage } from "@/components/inventory/inventory-page"

export default function Inventory() {
  const t = useTranslations("inventory")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <InventoryPage />
    </div>
  )
}
