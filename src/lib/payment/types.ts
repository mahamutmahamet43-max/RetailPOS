export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"

export type ProviderName = "SAHAL" | "STRIPE"

export interface InitiatePaymentParams {
  amount: number
  currency: string
  description: string
  customerPhone?: string
  customerEmail?: string
  idempotencyKey: string
  callbackUrl: string
}

export interface PaymentResult {
  success: boolean
  transactionRef: string
  status: PaymentStatus
  providerRef?: string
  checkoutUrl?: string
  error?: string
}

export interface VerifyPaymentResult {
  success: boolean
  status: PaymentStatus
  providerRef?: string
  error?: string
}

export interface PaymentProviderConfig {
  apiKey?: string
  apiSecret?: string
  webhookSecret?: string
  baseUrl?: string
  sandbox: boolean
}

export interface PaymentProvider {
  readonly name: ProviderName
  initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult>
  verifyPayment(transactionRef: string): Promise<VerifyPaymentResult>
  verifyWebhookSignature(payload: string, signature: string): boolean
}
