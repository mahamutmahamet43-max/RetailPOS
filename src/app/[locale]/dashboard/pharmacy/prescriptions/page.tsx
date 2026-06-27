"use client"

import * as React from "react"
import { Search, ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PharmacyLayout } from "@/components/pharmacy/pharmacy-layout"

interface Prescription {
  id: string
  prescriptionNumber: string
  customerName: string
  doctorName: string | null
  date: string
  notes: string | null
  createdAt: string
}

interface PrescriptionsResponse {
  prescriptions: Prescription[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PrescriptionsPage() {
  const [data, setData] = React.useState<PrescriptionsResponse | null>(null)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [customerName, setCustomerName] = React.useState("")
  const [doctorName, setDoctorName] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const fetchPrescriptions = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/pharmacy/prescriptions?${params}`)
      if (res.ok) {
        const d: PrescriptionsResponse = await res.json()
        setData(d)
      }
    } catch {
      console.error("Failed to fetch prescriptions")
    } finally {
      setLoading(false)
    }
  }, [search, page])

  React.useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!customerName.trim()) {
      setError("Customer/Patient name is required")
      return
    }

    setSaving(true)
    try {
      const body = JSON.stringify({
        customerName: customerName.trim(),
        doctorName: doctorName.trim() || null,
        notes: notes.trim() || null,
      })

      const res = await fetch("/api/pharmacy/prescriptions", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Something went wrong")
        return
      }

      fetchPrescriptions()
      setDialogOpen(false)
      setCustomerName("")
      setDoctorName("")
      setNotes("")
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">Manage patient prescriptions</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient or doctor name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Prescription
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient/Customer</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Prescription #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !data || data.prescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No prescriptions found</p>
                      <Button variant="link" onClick={() => setDialogOpen(true)}>
                        Add your first prescription
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.prescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">{rx.customerName}</TableCell>
                      <TableCell>{rx.doctorName || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {rx.prescriptionNumber}
                      </TableCell>
                      <TableCell>{new Date(rx.date || rx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {rx.notes || "-"}
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
                Showing {(data.page - 1) * data.limit + 1} to{" "}
                {Math.min(data.page * data.limit, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Prescription</DialogTitle>
              <DialogDescription>Record a new patient prescription</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="rx-customer">
                    Patient/Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="rx-customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Patient name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rx-doctor">Doctor Name</Label>
                  <Input
                    id="rx-doctor"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Doctor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rx-notes">Notes</Label>
                  <Textarea
                    id="rx-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Prescription notes..."
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PharmacyLayout>
  )
}
