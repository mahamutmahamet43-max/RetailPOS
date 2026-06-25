export interface TemplateVars {
  name?: string
  [key: string]: unknown
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function renderLayout(
  contentHtml: string,
  previewText: string
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>RetailPOS</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a1a2e !important; }
      .email-container { background-color: #16213e !important; }
      .email-text { color: #e0e0e0 !important; }
      .email-heading { color: #ffffff !important; }
      .email-footer-text { color: #a0a0a0 !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .email-button { width: 100% !important; display: block !important; }
      .email-header { padding: 20px 16px !important; }
      .email-content { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color:#f4f4f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td class="email-header" style="padding:32px 32px 16px;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);">
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;letter-spacing:-0.5px;">RetailPOS</h1>
              <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Point of Sale System</p>
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding:32px;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="padding:24px 32px;background-color:#f8f9fa;border-top:1px solid #e9ecef;">
              <p class="email-footer-text" style="margin:0 0 8px;font-size:12px;color:#6c757d;text-align:center;">
                &copy; ${new Date().getFullYear()} RetailPOS. All rights reserved.
              </p>
              <p class="email-footer-text" style="margin:0;font-size:12px;color:#6c757d;text-align:center;">
                This is an automated message from RetailPOS. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function renderButton(text: string, url: string): string {
  const safeUrl = escapeHtml(url)
  const safeText = escapeHtml(text)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${safeUrl}" class="email-button" style="display:inline-block;padding:14px 36px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;text-align:center;">${safeText}</a>
      </td>
    </tr>
  </table>`
}

export function renderText(text: string): string {
  const safe = escapeHtml(text)
  return `<p class="email-text" style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333333;">${safe.replace(/\n/g, "<br>")}</p>`
}

export function renderHeading(text: string): string {
  const safe = escapeHtml(text)
  return `<h2 class="email-heading" style="margin:0 0 16px;font-size:20px;color:#1a1a2e;font-weight:600;">${safe}</h2>`
}

export function renderDivider(): string {
  return `<hr style="border:none;border-top:1px solid #e9ecef;margin:24px 0;">`
}

export function renderInfoRow(label: string, value: string): string {
  const safeLabel = escapeHtml(label)
  const safeValue = escapeHtml(value)
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:#6c757d;width:40%;">${safeLabel}</td>
    <td style="padding:6px 0;font-size:14px;color:#333333;font-weight:500;">${safeValue}</td>
  </tr>`
}

export function renderInfoTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    ${rows}
  </table>`
}

export { escapeHtml }
