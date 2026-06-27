"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Users as UsersIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomerDialog } from "./customer-dialog"
import { DeleteCustomerDialog } from "./delete-customer-dialog"

export interface Customer {
  id: string
  customerCode: string
  firstName: string
  lastName: string | null
  companyName: string | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  notes: string | null
  creditLimit: number
  currentBalance: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  storeId: string
}

interface CustomersResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function CustomersTable() {
  const t = useTranslations("customers")
  const common = useTranslations("common")

  const [data, setData] = React.useState<CustomersResponse | null>(null)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<Customer | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/customers?${params}`)
      if (res.ok) {
        const data: CustomersResponse = await res.json()
        setData(data)
      }
    } catch {
      console.error("Failed to fetch customers")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  React.useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  React.useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const fullName = (c: Customer) =>
    [c.firstName, c.lastName].filter(Boolean).join(" ")

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={common("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{common("all")}</SelectItem>
            <SelectItem value="active">{common("active")}</SelectItem>
            <SelectItem value="inactive">{common("inactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customerCode")}</TableHead>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("company")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead className="text-right">{t("balance")}</TableHead>
              <TableHead>{common("status")}</TableHead>
              <TableHead className="w-[100px]">{common("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  {common("loading")}
                </TableCell>
              </TableRow>
            ) : !data || data.customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noCustomers")}</p>
                  <Button variant="link" onClick={() => setCreateOpen(true)}>
                    {t("addFirst")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              data.customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-xs">
                    {customer.customerCode}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="flex items-center gap-1 hover:underline text-primary"
                    >
                      {fullName(customer)}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[120px] truncate">
                    {customer.companyName || "-"}
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {customer.email || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        customer.currentBalance > 0
                          ? "text-destructive font-medium"
                          : ""
                      }
                    >
                      ${customer.currentBalance.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.isActive ? "success" : "secondary"}
                    >
                      {customer.isActive
                        ? common("active")
                        : common("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCustomer(customer)
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

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("showing", {
              from: (data.page - 1) * data.limit + 1,
              to: Math.min(data.page * data.limit, data.total),
              total: data.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {common("previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("pagination", { page, totalPages: data.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.totalPages, p + 1))
              }
              disabled={page >= data.totalPages}
            >
              {common("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchCustomers}
      />

      <CustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      <DeleteCustomerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />
    </div>
  )
}
