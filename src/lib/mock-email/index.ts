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

export function trialEndingEmail(name: string, daysLeft: number): EmailPayload {
  return {
    to: "",
    subject: "Your Trial is Ending Soon",
    body: `Hi ${name},\n\nYour RetailPOS free trial ends in ${daysLeft} days. Upgrade to keep using all features.\n\nBest,\nRetailPOS Team`,
  }
}

export function subscriptionActivatedEmail(name: string, plan: string): EmailPayload {
  return {
    to: "",
    subject: "Subscription Activated",
    body: `Hi ${name},\n\nYour ${plan} subscription is now active. Thank you for choosing RetailPOS!\n\nBest,\nRetailPOS Team`,
  }
}

export function paymentReceiptEmail(name: string, amount: number, plan: string): EmailPayload {
  return {
    to: "",
    subject: "Payment Receipt",
    body: `Hi ${name},\n\nThank you for your payment of $${amount.toFixed(2)} for the ${plan} plan.\n\nBest,\nRetailPOS Team`,
  }
}

export function subscriptionExpiredEmail(name: string): EmailPayload {
  return {
    to: "",
    subject: "Subscription Expired",
    body: `Hi ${name},\n\nYour RetailPOS subscription has expired. Please renew to continue using the service.\n\nBest,\nRetailPOS Team`,
  }
}
