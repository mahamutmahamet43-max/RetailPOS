export interface EmailPayload {
  to: string
  subject: string
  body: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  console.log(`[MOCK EMAIL] To: ${payload.to}`)
  console.log(`[MOCK EMAIL] Subject: ${payload.subject}`)
  console.log(`[MOCK EMAIL] Body: ${payload.body}`)
  return true
}

export function welcomeEmail(name: string, storeName: string): EmailPayload {
  return {
    to: "",
    subject: "Welcome to RetailPOS!",
    body: `Hi ${name},\n\nWelcome to RetailPOS! Your store "${storeName}" has been created.\n\nYour 14-day free trial has started. Enjoy all features!\n\nBest,\nRetailPOS Team`,
  }
}


