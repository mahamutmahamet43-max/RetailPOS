import { renderLayout, renderHeading, renderText, renderButton } from "./layout"

interface WelcomeVars {
  name: string
  storeName: string
  dashboardUrl: string
}

export function renderWelcomeHtml(vars: WelcomeVars): string {
  const content = `
    ${renderHeading(`Welcome to RetailPOS, ${vars.name}!`)}
    ${renderText(`Your store "${vars.storeName}" has been created successfully.`)}
    ${renderText("Your 14-day free trial has started. You now have access to all features including inventory management, sales tracking, reporting, and more.")}
    ${renderButton("Go to Dashboard", vars.dashboardUrl)}
    ${renderText("If you have any questions, check our help center or contact support.")}
  `
  return renderLayout(content, `Welcome to RetailPOS, ${vars.name}!`)
}

export function renderWelcomeText(vars: WelcomeVars): string {
  return [
    `Welcome to RetailPOS, ${vars.name}!`,
    "",
    `Your store "${vars.storeName}" has been created successfully.`,
    "",
    "Your 14-day free trial has started. You now have access to all features.",
    "",
    `Visit your dashboard: ${vars.dashboardUrl}`,
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
