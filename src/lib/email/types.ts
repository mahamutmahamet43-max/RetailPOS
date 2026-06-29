export type EmailTemplate =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "invoice"
  | "low-stock"
  | "daily-sales"
  | "backup-complete"
  | "staff-invite"

export type EmailProvider = "smtp" | "resend" | "sendgrid" | "postmark"

export interface SendEmailParams {
  to: string
  template: EmailTemplate
  subject: string
  html: string
  text: string
  data?: Record<string, unknown>
}

export interface EmailProviderConfig {
  fromAddress: string
  fromName: string
}

export interface EmailProviderInterface {
  readonly name: EmailProvider
  send(params: SendEmailParams): Promise<{ success: boolean; error?: string }>
}

export interface EmailLogEntry {
  id: string
  to: string
  template: EmailTemplate | string
  provider: EmailProvider | string
  status: "PENDING" | "SENT" | "FAILED"
  subject?: string
  retryCount: number
  maxRetries: number
  errorMessage?: string
  sentAt?: Date
  createdAt: Date
}
