import { useTranslations } from "next-intl"
import { ProductsTable } from "@/components/products/products-table"

export default function ProductsPage() {
  const t = useTranslations("products")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ProductsTable />
    </div>
  )
}
