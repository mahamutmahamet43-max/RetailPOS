import type { EmailProviderInterface, SendEmailParams } from "../types"
import type { EmailProvider } from "../types"
import { getPostmarkApiKey, getProviderConfig } from "../config"

export class PostmarkProvider implements EmailProviderInterface {
  readonly name: EmailProvider = "postmark"

  async send(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
      const config = getProviderConfig()
      const apiKey = getPostmarkApiKey()
      if (!apiKey) {
        return { success: false, error: "Postmark API key not configured" }
      }

      const response = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          From: `${config.fromName} <${config.fromAddress}>`,
          To: params.to,
          Subject: params.subject,
          HtmlBody: params.html,
          TextBody: params.text,
          MessageStream: "outbound",
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const body = await response.text()
        return { success: false, error: `Postmark API error: ${response.status} ${body}` }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Postmark send failed",
      }
    }
  }
}
