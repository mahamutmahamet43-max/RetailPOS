import type { PaymentProvider, ProviderName } from "./types"
import { SifaloPayProvider } from "./sifalo"
import { StripeProvider } from "./stripe"

const instances: Partial<Record<ProviderName, PaymentProvider>> = {}

function getInstance<T extends PaymentProvider>(name: ProviderName, ctor: new () => T): T {
  if (!instances[name]) {
    instances[name] = new ctor()
  }
  return instances[name] as T
}

export function getPaymentProvider(name: ProviderName): PaymentProvider {
  switch (name) {
    case "SAHAL":
      return getInstance("SAHAL", SifaloPayProvider)
    case "STRIPE":
      return getInstance("STRIPE", StripeProvider)
    default:
      throw new Error(`Unknown payment provider: ${name}`)
  }
}

export function getPaymentProviderByName(name: string): PaymentProvider {
  const upper = name.toUpperCase() as ProviderName
  const valid = ["SAHAL", "STRIPE"]
  if (!valid.includes(upper)) {
    throw new Error(`Unknown payment provider: ${name}`)
  }
  return getPaymentProvider(upper)
}

export function listProviders(): ProviderName[] {
  return ["SAHAL", "STRIPE"]
}
