import { renderLayout, renderHeading, renderText, renderButton, renderInfoTable, renderInfoRow } from "./layout"

interface SubscriptionConfirmedVars {
  name: string
  plan: string
  amount: string
  nextBillingDate: string
  billingUrl: string
}

export function renderSubscriptionConfirmedHtml(vars: SubscriptionConfirmedVars): string {
  const rows = renderInfoRow("Plan", vars.plan) +
    renderInfoRow("Amount", vars.amount) +
    renderInfoRow("Next Billing", vars.nextBillingDate)

  const content = `
    ${renderHeading("Subscription Confirmed!")}
    ${renderText(`Thank you, ${vars.name}! Your RetailPOS subscription is now active.`)}
    ${renderInfoTable(rows)}
    ${renderButton("Manage Subscription", vars.billingUrl)}
    ${renderText("You now have access to all features included in your plan.")}
  `
  return renderLayout(content, `Your ${vars.plan} subscription is active`)
}

export function renderSubscriptionConfirmedText(vars: SubscriptionConfirmedVars): string {
  return [
    "Subscription Confirmed!",
    "",
    `Thank you, ${vars.name}! Your RetailPOS subscription is now active.`,
    "",
    `Plan: ${vars.plan}`,
    `Amount: ${vars.amount}`,
    `Next Billing: ${vars.nextBillingDate}`,
    "",
    `Manage your subscription: ${vars.billingUrl}`,
    "",
    "You now have access to all features included in your plan.",
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
