import { sendWithRetry } from "./retry"
import type { EmailTemplate, EmailProvider } from "./types"
import { renderWelcomeHtml, renderWelcomeText } from "./templates/welcome"
import { renderVerifyEmailHtml, renderVerifyEmailText } from "./templates/verify-email"
import { renderPasswordResetHtml, renderPasswordResetText } from "./templates/password-reset"
import { renderInvoiceHtml, renderInvoiceText } from "./templates/invoice"
import { renderLowStockHtml, renderLowStockText } from "./templates/low-stock"
import { renderDailySalesHtml, renderDailySalesText } from "./templates/daily-sales"
import { renderBackupCompleteHtml, renderBackupCompleteText } from "./templates/backup-complete"
import { renderStaffInviteHtml, renderStaffInviteText } from "./templates/staff-invite"
import { escapeHtml } from "./templates/layout"

export interface EmailOptions {
  to: string
  templateName: EmailTemplate
  vars: Record<string, unknown>
  subject?: string
}

function getTemplateRenderers(templateName: EmailTemplate) {
  switch (templateName) {
    case "welcome":
      return { html: renderWelcomeHtml, text: renderWelcomeText }
    case "verify-email":
      return { html: renderVerifyEmailHtml, text: renderVerifyEmailText }
    case "password-reset":
      return { html: renderPasswordResetHtml, text: renderPasswordResetText }
    case "invoice":
      return { html: renderInvoiceHtml, text: renderInvoiceText }
    case "low-stock":
      return { html: renderLowStockHtml, text: renderLowStockText }
    case "daily-sales":
      return { html: renderDailySalesHtml, text: renderDailySalesText }
    case "backup-complete":
      return { html: renderBackupCompleteHtml, text: renderBackupCompleteText }
    case "staff-invite":
      return { html: renderStaffInviteHtml, text: renderStaffInviteText }
  }
}

function getDefaultSubject(templateName: EmailTemplate): string {
  const subjects: Record<EmailTemplate, string> = {
    "welcome": "Welcome to RetailPOS!",
    "verify-email": "Verify your email address",
    "password-reset": "Reset your password",
    "invoice": "Invoice from RetailPOS",
    "low-stock": "Low stock alert",
    "daily-sales": "Daily sales summary",
    "backup-complete": "Backup completed",
    "staff-invite": "You've been invited to RetailPOS",
  }
  return subjects[templateName]
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function sendTemplateEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!validateEmail(options.to)) {
    return { success: false, error: `Invalid email address: ${options.to}` }
  }

  const renderers = getTemplateRenderers(options.templateName)
  const html = renderers.html(options.vars as never)
  const text = renderers.text(options.vars as never)
  const subject = options.subject || getDefaultSubject(options.templateName)

  return sendWithRetry({
    to: options.to,
    template: options.templateName,
    subject,
    html,
    text,
    data: options.vars,
  })
}

export async function sendWelcomeEmail(to: string, name: string, storeName: string): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to,
    templateName: "welcome",
    vars: {
      name: escapeHtml(name || "there"),
      storeName: escapeHtml(storeName),
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
    },
  })
}

export async function sendLowStockEmail(
  to: string,
  name: string,
  storeName: string,
  productName: string,
  currentStock: number,
  minimumStock: number
): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to,
    templateName: "low-stock",
    vars: {
      name: escapeHtml(name),
      storeName: escapeHtml(storeName),
      productName: escapeHtml(productName),
      currentStock,
      minimumStock,
      inventoryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/inventory`,
    },
  })
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to,
    templateName: "password-reset",
    vars: {
      name: escapeHtml(name),
      resetUrl,
    },
  })
}

export async function sendVerifyEmailEmail(
  to: string,
  name: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to,
    templateName: "verify-email",
    vars: {
      name: escapeHtml(name),
      verificationUrl,
    },
  })
}

export async function sendBackupCompleteEmail(
  to: string,
  name: string,
  filename: string,
  size: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to,
    templateName: "backup-complete",
    vars: {
      name: escapeHtml(name),
      filename,
      size,
      date: new Date().toLocaleDateString(),
      storeName: "RetailPOS",
    },
  })
}

export async function sendInvoiceEmail(
  to: string,
  name: string,
  invoiceNumber: string,
  amount: string,
  items: Array<{ name: string; quantity: number; price: string; total: string }>,
  storeName: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplateEmail({
    to,
    templateName: "invoice",
    subject: `Invoice ${invoiceNumber} from ${storeName}`,
    vars: {
      name: escapeHtml(name),
      invoiceNumber,
      amount,
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString(),
      storeName: escapeHtml(storeName),
      items,
    },
  })
}
