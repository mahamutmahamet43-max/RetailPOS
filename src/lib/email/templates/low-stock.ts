import { renderLayout, renderHeading, renderText, renderButton, renderInfoTable, renderInfoRow } from "./layout"

interface LowStockVars {
  name: string
  storeName: string
  productName: string
  currentStock: number
  minimumStock: number
  inventoryUrl: string
}

export function renderLowStockHtml(vars: LowStockVars): string {
  const rows = renderInfoRow("Product", vars.productName) +
    renderInfoRow("Current Stock", String(vars.currentStock)) +
    renderInfoRow("Minimum Stock", String(vars.minimumStock))

  const content = `
    ${renderHeading("Low Stock Alert")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText(`The product "${vars.productName}" in ${vars.storeName} is running low on stock.`)}
    ${renderInfoTable(rows)}
    ${renderButton("View Inventory", vars.inventoryUrl)}
    ${renderText("Please reorder soon to avoid running out of stock.")}
  `
  return renderLayout(content, `Low stock alert: ${vars.productName}`)
}

export function renderLowStockText(vars: LowStockVars): string {
  return [
    "Low Stock Alert",
    "",
    `Hi ${vars.name},`,
    "",
    `The product "${vars.productName}" in ${vars.storeName} is running low on stock.`,
    "",
    `Product: ${vars.productName}`,
    `Current Stock: ${vars.currentStock}`,
    `Minimum Stock: ${vars.minimumStock}`,
    "",
    `View inventory: ${vars.inventoryUrl}`,
    "",
    "Please reorder soon to avoid running out of stock.",
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
