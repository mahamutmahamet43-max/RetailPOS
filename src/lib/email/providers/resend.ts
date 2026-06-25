import type { EmailProviderInterface, SendEmailParams } from "../types"
import type { EmailProvider } from "../types"
import { getResendApiKey, getProviderConfig } from "../config"

export class ResendProvider implements EmailProviderInterface {
  readonly name: EmailProvider = "resend"

  async send(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const config = getProviderConfig()
      const apiKey = getResendApiKey()
      if (!apiKey) {
        return { success: false, error: "Resend API key not configured" }
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${config.fromName} <${config.fromAddress}>`,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const body = await response.text()
        return { success: false, error: `Resend API error: ${response.status} ${body}` }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Resend send failed",
      }
    }
  }
}
