"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Pencil, Trash2, Plus, Search, Package } from "lucide-react"
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
import { CategoryDialog } from "./category-dialog"
import { DeleteCategoryDialog } from "./delete-category-dialog"

export interface Category {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  storeId: string
}

export function CategoriesTable() {
  const t = useTranslations("categories")
  const common = useTranslations("common")

  const [categories, setCategories] = React.useState<Category[]>([])
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const fetchCategories = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/categories${params}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      console.error("Failed to fetch categories")
    } finally {
      setLoading(false)
    }
  }, [search])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filtered = React.useMemo(() => {
    if (!search) return categories
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description &&
          c.description.toLowerCase().includes(search.toLowerCase()))
    )
  }, [categories, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchCategory")}
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
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("color")}</TableHead>
              <TableHead>{common("status")}</TableHead>
              <TableHead className="w-[100px]">{common("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {common("loading")}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noCategories")}</p>
                  <Button
                    variant="link"
                    onClick={() => setCreateOpen(true)}
                  >
                    {t("addFirst")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell>
                    {category.color ? (
                      <span className="text-xs font-mono">{category.color}</span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "success" : "secondary"}>
                      {category.isActive ? common("active") : common("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCategory(category)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCategory(category)
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

      <CategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchCategories}
      />

      <CategoryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />
    </div>
  )
}
