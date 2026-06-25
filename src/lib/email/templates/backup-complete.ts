import { renderLayout, renderHeading, renderText, renderInfoTable, renderInfoRow } from "./layout"

interface BackupCompleteVars {
  name: string
  filename: string
  size: string
  date: string
  storeName: string
}

export function renderBackupCompleteHtml(vars: BackupCompleteVars): string {
  const rows = renderInfoRow("File", vars.filename) +
    renderInfoRow("Size", vars.size) +
    renderInfoRow("Date", vars.date) +
    renderInfoRow("Store", vars.storeName)

  const content = `
    ${renderHeading("Backup Completed Successfully")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText("Your RetailPOS database backup has been created successfully.")}
    ${renderInfoTable(rows)}
    ${renderText("No further action is required. Backups are securely stored.")}
  `
  return renderLayout(content, `Backup complete: ${vars.filename}`)
}

export function renderBackupCompleteText(vars: BackupCompleteVars): string {
  return [
    "Backup Completed Successfully",
    "",
    `Hi ${vars.name},`,
    "",
    "Your RetailPOS database backup has been created successfully.",
    "",
    `File: ${vars.filename}`,
    `Size: ${vars.size}`,
    `Date: ${vars.date}`,
    `Store: ${vars.storeName}`,
    "",
    "No further action is required. Backups are securely stored.",
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
