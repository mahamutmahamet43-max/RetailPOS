import { useTranslations } from "next-intl"
import { CustomersTable } from "@/components/customers/customers-table"

export default function CustomersPage() {
  const t = useTranslations("customers")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <CustomersTable />
    </div>
  )
}
