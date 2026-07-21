import type { PaymentProvider, ProviderName } from "./types"
import { ZaadProvider } from "./zaad"
import { EvcPlusProvider } from "./evc-plus"
import { SahalProvider } from "./sahal"
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
    case "ZAAD":
      return getInstance("ZAAD", ZaadProvider)
    case "EVC_PLUS":
      return getInstance("EVC_PLUS", EvcPlusProvider)
    case "SAHAL":
      return getInstance("SAHAL", SahalProvider)
    case "STRIPE":
      return getInstance("STRIPE", StripeProvider)
  }
}

export function getPaymentProviderByName(name: string): PaymentProvider {
  const upper = name.toUpperCase() as ProviderName
  const valid = ["ZAAD", "EVC_PLUS", "SAHAL", "STRIPE"]
  if (!valid.includes(upper)) {
    throw new Error(`Unknown payment provider: ${name}`)
  }
  return getPaymentProvider(upper)
}

export function listProviders(): ProviderName[] {
  return ["ZAAD", "EVC_PLUS", "SAHAL", "STRIPE"]
}
