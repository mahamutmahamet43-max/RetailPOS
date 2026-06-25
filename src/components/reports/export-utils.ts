export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          if (val === null || val === undefined) return ""
          const str = String(val)
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadXLSX(
  data: Record<string, unknown>[],
  filename: string
) {
  const XLSX = require("xlsx")
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function printReport(elementId: string) {
  const el = document.getElementById(elementId)
  if (!el) return

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .summary { margin-bottom: 16px; }
          .summary-item { display: inline-block; margin-right: 24px; }
          .summary-label { font-size: 10px; color: #666; }
          .summary-value { font-size: 16px; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
          @media print {
            body { margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${el.innerHTML}
        <div class="footer">Generated on ${new Date().toLocaleString()}</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
