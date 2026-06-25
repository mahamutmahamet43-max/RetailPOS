import type { EmailProviderInterface, SendEmailParams } from "../types"
import type { EmailProvider } from "../types"
import { getSendgridApiKey, getProviderConfig } from "../config"

export class SendGridProvider implements EmailProviderInterface {
  readonly name: EmailProvider = "sendgrid"

  async send(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const config = getProviderConfig()
      const apiKey = getSendgridApiKey()
      if (!apiKey) {
        return { success: false, error: "SendGrid API key not configured" }
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: params.to }] }],
          from: { email: config.fromAddress, name: config.fromName },
          subject: params.subject,
          content: [
            { type: "text/plain", value: params.text },
            { type: "text/html", value: params.html },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const body = await response.text()
        return { success: false, error: `SendGrid API error: ${response.status} ${body}` }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "SendGrid send failed",
      }
    }
  }
}
