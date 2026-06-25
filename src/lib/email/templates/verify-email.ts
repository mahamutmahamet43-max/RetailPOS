import { renderLayout, renderHeading, renderText, renderButton } from "./layout"

interface VerifyEmailVars {
  name: string
  verificationUrl: string
}

export function renderVerifyEmailHtml(vars: VerifyEmailVars): string {
  const content = `
    ${renderHeading("Verify Your Email Address")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText("Please verify your email address by clicking the button below. This link expires in 24 hours.")}
    ${renderButton("Verify Email", vars.verificationUrl)}
    ${renderText("If you did not create an account, you can safely ignore this email.")}
  `
  return renderLayout(content, "Verify your email address")
}

export function renderVerifyEmailText(vars: VerifyEmailVars): string {
  return [
    "Verify Your Email Address",
    "",
    `Hi ${vars.name},`,
    "",
    "Please verify your email address by clicking the link below. This link expires in 24 hours.",
    "",
    `${vars.verificationUrl}`,
    "",
    "If you did not create an account, you can safely ignore this email.",
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
