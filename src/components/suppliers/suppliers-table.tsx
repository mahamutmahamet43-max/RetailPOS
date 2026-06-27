"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Pencil, Trash2, Plus, Search, Building2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SupplierDialog } from "./supplier-dialog"
import { DeleteSupplierDialog } from "./delete-supplier-dialog"

export interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  storeId: string
  _count?: { purchases: number }
}

export function SuppliersTable() {
  const t = useTranslations("suppliers")
  const common = useTranslations("common")

  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const fetchSuppliers = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/suppliers${params}`)
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      }
    } catch {
      console.error("Failed to fetch suppliers")
    } finally {
      setLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("address")}</TableHead>
              <TableHead>{t("purchases")}</TableHead>
              <TableHead className="w-[100px]">{common("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {common("loading")}
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noSuppliers")}</p>
                  <Button variant="link" onClick={() => setCreateOpen(true)}>
                    {t("addFirst")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/suppliers/${supplier.id}`}
                      className="flex items-center gap-1 hover:underline text-primary"
                    >
                      {supplier.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell>{supplier.email || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {supplier.address || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{supplier._count?.purchases ?? 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchSuppliers}
      />

      <SupplierDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />

      <DeleteSupplierDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />
    </div>
  )
}
