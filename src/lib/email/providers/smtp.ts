import { createTransport } from "nodemailer"
import type { EmailProviderInterface, SendEmailParams } from "../types"
import type { EmailProvider } from "../types"
import { getSmtpConfig, getProviderConfig } from "../config"

export class SmtpProvider implements EmailProviderInterface {
  readonly name: EmailProvider = "smtp"
  private transport: ReturnType<typeof createTransport> | null = null

  private getTransport() {
    if (!this.transport) {
      const smtp = getSmtpConfig()
      this.transport = createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
      })
    }
    return this.transport
  }

  async send(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const config = getProviderConfig()
      await this.getTransport().sendMail({
        from: `"${config.fromName}" <${config.fromAddress}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SMTP send failed",
      }
    }
  }
}
