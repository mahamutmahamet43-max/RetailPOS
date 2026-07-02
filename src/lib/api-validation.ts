import { z } from "zod"
import { NextResponse } from "next/server"

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const idParamSchema = z.string().min(1, "ID is required")

export const emailSchema = z.string().email("Invalid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")

export const positiveNumberSchema = z
  .number()
  .positive("Value must be positive")

export const nonNegativeNumberSchema = z
  .number()
  .min(0, "Value must be non-negative")

export const productUnitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Unit name is required"),
  conversionFactor: z.number().positive("Conversion factor must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative").optional(),
  barcode: z.string().optional().nullable(),
  isBaseUnit: z.boolean().default(false),
  isDefaultSaleUnit: z.boolean().default(false),
})

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  costPrice: z.number().min(0, "Cost price must be non-negative").default(0),
  stockQuantity: z.number().int().min(0, "Stock quantity must be non-negative").default(0),
  minimumStock: z.number().int().min(0).default(0),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  unit: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  isPharmacyItem: z.boolean().optional().default(false),
  requiresPrescription: z.boolean().optional().default(false),
  units: z.array(productUnitSchema).optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

export const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  creditLimit: z.number().min(0, "Credit limit must be non-negative").default(0),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  barcode: z.string().optional().nullable(),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  discount: z.number().min(0).default(0),
  productUnitId: z.string().optional().nullable(),
  unitName: z.string().default("pcs"),
  unitConversionFactor: z.number().positive().default(1),
})

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  customerId: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CARD", "CREDIT"]),
  amountPaid: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  localId: z.string().optional().nullable(),
})

export const customerPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CARD"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
})

export const inventorySchema = z.object({
  productId: z.string().min(1, "Product is required"),
  transactionType: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional().nullable(),
})

export const settingsProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  image: z.string().optional().nullable(),
})

export const settingsPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1),
  productUnitId: z.string().optional().nullable(),
  unitName: z.string().default("pcs"),
  unitConversionFactor: z.number().positive("Conversion factor must be positive").default(1),
  quantity: z.number().int().positive("Quantity must be positive"),
  costPrice: z.number().min(0, "Cost price must be non-negative"),
})

export const purchaseSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().min(1, "Supplier name is required"),
  notes: z.string().optional().nullable(),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
})

export const productUpdateSchema = productSchema.partial()
export const categoryUpdateSchema = categorySchema.partial()
export const customerUpdateSchema = customerSchema.partial()
export const supplierUpdateSchema = supplierSchema.partial()
export const saleActionSchema = z.object({
  action: z.literal("void"),
})

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function errorResponse(
  message: string,
  status: number,
  details?: Record<string, string[]>
): NextResponse {
  const body: Record<string, unknown> = { error: message }
  if (details) body.details = details
  return NextResponse.json(body, { status })
}

export function unauthorizedResponse(): NextResponse {
  return errorResponse("Unauthorized", 401)
}

export function forbiddenResponse(): NextResponse {
  return errorResponse("Forbidden: insufficient permissions", 403)
}

export function notFoundResponse(resource = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404)
}

export function validateOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const details: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join(".")
      if (!details[path]) details[path] = []
      details[path].push(issue.message)
    }
    return { success: false, response: errorResponse("Validation failed", 400, details) }
  }
  return { success: true, data: result.data }
}
