import type { EmailProvider, EmailProviderInterface } from "./types"
import { SmtpProvider } from "./providers/smtp"
import { ResendProvider } from "./providers/resend"
import { SendGridProvider } from "./providers/sendgrid"
import { PostmarkProvider } from "./providers/postmark"
import { getActiveProvider } from "./config"

const instances: Partial<Record<EmailProvider, EmailProviderInterface>> = {}

function getInstance<T extends EmailProviderInterface>(name: EmailProvider, ctor: new () => T): T {
  if (!instances[name]) {
    instances[name] = new ctor()
  }
  return instances[name] as T
}

export function getEmailProvider(name: EmailProvider): EmailProviderInterface {
  switch (name) {
    case "smtp":
      return getInstance("smtp", SmtpProvider)
    case "resend":
      return getInstance("resend", ResendProvider)
    case "sendgrid":
      return getInstance("sendgrid", SendGridProvider)
    case "postmark":
      return getInstance("postmark", PostmarkProvider)
  }
}

export function getActiveEmailProvider(): EmailProviderInterface {
  const name = getActiveProvider()
  return getEmailProvider(name)
}
