import type { PaymentProviderConfig, ProviderName } from "./types"

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Missing required environment variable: ${name}`)
  return val
}

function optional(name: string, fallback = ""): string {
  return process.env[name] || fallback
}

function isSandbox(): boolean {
  return process.env.PAYMENT_SANDBOX !== "false"
}

const PROVIDER_CONFIGS: Record<ProviderName, () => PaymentProviderConfig> = {
  ZAAD: () => ({
    apiKey: process.env.ZAAD_API_KEY,
    apiSecret: process.env.ZAAD_API_SECRET,
    webhookSecret: process.env.ZAAD_WEBHOOK_SECRET || process.env.ZAAD_API_SECRET,
    baseUrl: process.env.ZAAD_API_URL || "https://api.zaad.so",
    sandbox: isSandbox(),
  }),
  EVC_PLUS: () => ({
    apiKey: process.env.EVC_PLUS_API_KEY,
    apiSecret: process.env.EVC_PLUS_API_SECRET,
    webhookSecret: process.env.EVC_PLUS_WEBHOOK_SECRET || process.env.EVC_PLUS_API_SECRET,
    baseUrl: process.env.EVC_PLUS_API_URL || "https://api.evcplus.so",
    sandbox: isSandbox(),
  }),
  SAHAL: () => ({
    apiKey: process.env.SAHAL_API_KEY,
    apiSecret: process.env.SAHAL_API_SECRET,
    webhookSecret: process.env.SAHAL_WEBHOOK_SECRET || process.env.SAHAL_API_SECRET,
    baseUrl: process.env.SAHAL_API_URL || "https://api.sahal.so",
    sandbox: isSandbox(),
  }),
  STRIPE: () => ({
    apiKey: process.env.STRIPE_SECRET_KEY,
    apiSecret: process.env.STRIPE_SECRET_KEY,
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
    baseUrl: "https://api.stripe.com/v1",
    sandbox: isSandbox(),
  }),
}

export function getProviderConfig(name: ProviderName): PaymentProviderConfig {
  return PROVIDER_CONFIGS[name]()
}

export function hasCredentials(name: ProviderName): boolean {
  const config = getProviderConfig(name)
  return !!(config.apiKey && config.apiSecret)
}

export function getStripePublishableKey(): string {
  return optional("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_placeholder")
}
