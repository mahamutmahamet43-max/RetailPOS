import { renderLayout, renderHeading, renderText, renderInfoTable, renderInfoRow, renderDivider } from "./layout"

interface DailySalesVars {
  name: string
  storeName: string
  date: string
  totalSales: number
  totalRevenue: string
  totalTransactions: number
  averageOrderValue: string
  topProduct: string
  reportsUrl: string
}

export function renderDailySalesHtml(vars: DailySalesVars): string {
  const rows = renderInfoRow("Date", vars.date) +
    renderInfoRow("Total Sales", String(vars.totalSales)) +
    renderInfoRow("Revenue", vars.totalRevenue) +
    renderInfoRow("Transactions", String(vars.totalTransactions)) +
    renderInfoRow("Avg Order", vars.averageOrderValue) +
    renderInfoRow("Top Product", vars.topProduct)

  const content = `
    ${renderHeading("Daily Sales Summary")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText(`Here is your daily sales summary for ${vars.storeName}.`)}
    ${renderInfoTable(rows)}
    ${renderDivider()}
    ${renderText(`View full report: ${vars.reportsUrl}`)}
  `
  return renderLayout(content, `Daily sales summary for ${vars.storeName}`)
}

export function renderDailySalesText(vars: DailySalesVars): string {
  return [
    "Daily Sales Summary",
    "",
    `Hi ${vars.name},`,
    "",
    `Here is your daily sales summary for ${vars.storeName}.`,
    "",
    `Date: ${vars.date}`,
    `Total Sales: ${vars.totalSales}`,
    `Revenue: ${vars.totalRevenue}`,
    `Transactions: ${vars.totalTransactions}`,
    `Avg Order: ${vars.averageOrderValue}`,
    `Top Product: ${vars.topProduct}`,
    "",
    `View full report: ${vars.reportsUrl}`,
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
