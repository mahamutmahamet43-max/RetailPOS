import { renderLayout, renderHeading, renderText, renderButton } from "./layout"

interface PasswordResetVars {
  name: string
  resetUrl: string
}

export function renderPasswordResetHtml(vars: PasswordResetVars): string {
  const content = `
    ${renderHeading("Reset Your Password")}
    ${renderText(`Hi ${vars.name},`)}
    ${renderText("We received a request to reset your password. Click the button below to create a new one. This link expires in 1 hour.")}
    ${renderButton("Reset Password", vars.resetUrl)}
    ${renderText("If you did not request a password reset, please ignore this email and make sure your account is secure.")}
  `
  return renderLayout(content, "Reset your RetailPOS password")
}

export function renderPasswordResetText(vars: PasswordResetVars): string {
  return [
    "Reset Your Password",
    "",
    `Hi ${vars.name},`,
    "",
    "We received a request to reset your password. Click the link below to create a new one. This link expires in 1 hour.",
    "",
    `${vars.resetUrl}`,
    "",
    "If you did not request a password reset, please ignore this email.",
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
