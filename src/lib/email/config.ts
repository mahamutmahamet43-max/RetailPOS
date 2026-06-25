import type { EmailProvider, EmailProviderConfig } from "./types"

export function getActiveProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "smtp").toLowerCase() as EmailProvider
  const valid: EmailProvider[] = ["smtp", "resend", "sendgrid", "postmark"]
  if (!valid.includes(provider)) {
    console.warn(`Unknown EMAIL_PROVIDER "${provider}", falling back to smtp`)
    return "smtp"
  }
  return provider
}

export function getProviderConfig(): EmailProviderConfig {
  return {
    fromAddress: process.env.EMAIL_FROM_ADDRESS || "noreply@retailpos.com",
    fromName: process.env.EMAIL_FROM_NAME || "RetailPOS",
  }
}

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
}

export function getSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  }
}

export function getResendApiKey(): string {
  return process.env.RESEND_API_KEY || ""
}

export function getSendgridApiKey(): string {
  return process.env.SENDGRID_API_KEY || ""
}

export function getPostmarkApiKey(): string {
  return process.env.POSTMARK_API_KEY || ""
}

export function hasProviderCredentials(name: EmailProvider): boolean {
  switch (name) {
    case "smtp":
      return !!process.env.SMTP_HOST
    case "resend":
      return !!process.env.RESEND_API_KEY
    case "sendgrid":
      return !!process.env.SENDGRID_API_KEY
    case "postmark":
      return !!process.env.POSTMARK_API_KEY
  }
}
