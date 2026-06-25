import { renderLayout, renderHeading, renderText, renderInfoTable, renderInfoRow, renderDivider } from "./layout"

interface InvoiceVars {
  name: string
  invoiceNumber: string
  amount: string
  date: string
  dueDate: string
  storeName: string
  items: Array<{ name: string; quantity: number; price: string; total: string }>
  billingUrl: string
}

export function renderInvoiceHtml(vars: InvoiceVars): string {
  const rows = renderInfoRow("Invoice", vars.invoiceNumber) +
    renderInfoRow("Date", vars.date) +
    renderInfoRow("Due Date", vars.dueDate) +
    renderInfoRow("Store", vars.storeName)

  const itemsHtml = vars.items.map((item, i) => {
    const bg = i % 2 === 0 ? "#f8f9fa" : "#ffffff"
    return `<tr style="background-color:${bg};">
      <td style="padding:8px 12px;font-size:14px;color:#333;">${item.name}</td>
      <td style="padding:8px 12px;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;font-size:14px;color:#333;text-align:right;">${item.price}</td>
      <td style="padding:8px 12px;font-size:14px;color:#333;text-align:right;font-weight:600;">${item.total}</td>
    </tr>`
  }).join("")

  const content = `
    ${renderHeading("Invoice")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText(`Please find your invoice from ${vars.storeName} attached below.`)}
    ${renderInfoTable(rows)}
    ${renderDivider()}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <thead>
        <tr style="background-color:#2563eb;">
          <th style="padding:10px 12px;font-size:13px;color:#ffffff;text-align:left;font-weight:600;">Item</th>
          <th style="padding:10px 12px;font-size:13px;color:#ffffff;text-align:center;font-weight:600;">Qty</th>
          <th style="padding:10px 12px;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">Price</th>
          <th style="padding:10px 12px;font-size:13px;color:#ffffff;text-align:right;font-weight:600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:10px 12px;font-size:15px;color:#333;text-align:right;font-weight:600;border-top:2px solid #2563eb;">Total</td>
          <td style="padding:10px 12px;font-size:15px;color:#2563eb;text-align:right;font-weight:700;border-top:2px solid #2563eb;">${vars.amount}</td>
        </tr>
      </tfoot>
    </table>
    ${renderDivider()}
    ${renderText(`View full invoice: ${vars.billingUrl}`)}
  `
  return renderLayout(content, `Invoice ${vars.invoiceNumber} from ${vars.storeName}`)
}

export function renderInvoiceText(vars: InvoiceVars): string {
  const itemsText = vars.items.map(i =>
    `  ${i.name} x${i.quantity} — ${i.price} each — ${i.total}`
  ).join("\n")

  return [
    "Invoice",
    "",
    `Hi ${vars.name},`,
    "",
    `Please find your invoice from ${vars.storeName}.`,
    "",
    `Invoice: ${vars.invoiceNumber}`,
    `Date: ${vars.date}`,
    `Due Date: ${vars.dueDate}`,
    `Store: ${vars.storeName}`,
    "",
    "Items:",
    itemsText,
    "",
    `Total: ${vars.amount}`,
    "",
    `View full invoice: ${vars.billingUrl}`,
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
