import { renderLayout, renderHeading, renderText, renderButton } from "./layout"

interface StaffInviteVars {
  inviterName: string
  storeName: string
  role: string
  inviteUrl: string
}

export function renderStaffInviteHtml(vars: StaffInviteVars): string {
  const content = `
    ${renderHeading("You've Been Invited to RetailPOS")}
    ${renderText(`${vars.inviterName} has invited you to join "${vars.storeName}" as a ${vars.role}.`)}
    ${renderText("Click the button below to accept the invitation and set up your account.")}
    ${renderButton("Accept Invitation", vars.inviteUrl)}
    ${renderText("This invitation expires in 7 days.")}
    ${renderText("If you were not expecting this invitation, you can safely ignore this email.")}
  `
  return renderLayout(content, `Invitation to join ${vars.storeName}`)
}

export function renderStaffInviteText(vars: StaffInviteVars): string {
  return [
    "You've Been Invited to RetailPOS",
    "",
    `${vars.inviterName} has invited you to join "${vars.storeName}" as a ${vars.role}.`,
    "",
    "Click the link below to accept the invitation and set up your account.",
    "",
    `${vars.inviteUrl}`,
    "",
    "This invitation expires in 7 days.",
    "",
    "If you were not expecting this invitation, you can safely ignore this email.",
    "",
    "Best,",
    "RetailPOS Team",
  ].join("\n")
}
