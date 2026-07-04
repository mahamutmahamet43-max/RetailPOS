import { renderLayout, renderHeading, renderText, renderInfoTable, renderInfoRow, renderDivider } from "./layout"

interface PaymentReceiptVars {
  name: string
  receiptNumber: string
  amount: string
  plan: string
  paymentMethod: string
  date: string
  billingUrl: string
}

export function renderPaymentReceiptHtml(vars: PaymentReceiptVars): string {
  const rows = renderInfoRow("Receipt", vars.receiptNumber) +
    renderInfoRow("Amount", vars.amount) +
    renderInfoRow("Plan", vars.plan) +
    renderInfoRow("Payment Method", vars.paymentMethod) +
    renderInfoRow("Date", vars.date)

  const content = `
    ${renderHeading("Payment Receipt")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText("Thank you for your payment. Here is your receipt.")}
    ${renderInfoTable(rows)}
    ${renderDivider()}
    ${renderText(`View all receipts: ${vars.billingUrl}`)}
  `
  return renderLayout(content, `Receipt: ${vars.receiptNumber}`)
}

export function renderPaymentReceiptText(vars: PaymentReceiptVars): string {
  return [
    "Payment Receipt",
    "",
    `Hi ${vars.name},`,
    "",
    "Thank you for your payment. Here is your receipt.",
    "",
    `Receipt: ${vars.receiptNumber}`,
    `Amount: ${vars.amount}`,
    `Plan: ${vars.plan}`,
    `Payment Method: ${vars.paymentMethod}`,
    `Date: ${vars.date}`,
    "",
    `View all receipts: ${vars.billingUrl}`,
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
