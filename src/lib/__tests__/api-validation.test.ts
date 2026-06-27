import { describe, it, expect } from "vitest"
import { validateOrError, productSchema, productUpdateSchema, supplierSchema, customerSchema, saleSchema, paginationSchema } from "../api-validation"

describe("validateOrError", () => {
  it("returns success for valid product data", () => {
    const result = validateOrError(productSchema, {
      name: "Test Product",
      categoryId: "cat-1",
      sellingPrice: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("Test Product")
      expect(result.data.sellingPrice).toBe(10)
    }
  })

  it("returns error for missing required fields", () => {
    const result = validateOrError(productSchema, { name: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.response).toBeDefined()
    }
  })

  it("returns error for negative price", () => {
    const result = validateOrError(productSchema, {
      name: "Test",
      categoryId: "cat-1",
      sellingPrice: -5,
    })
    expect(result.success).toBe(false)
  })
})

describe("productSchema", () => {
  it("validates with optional fields", () => {
    const result = productSchema.safeParse({
      name: "Product",
      categoryId: "cat-1",
      sellingPrice: 15.99,
      costPrice: 10,
      stockQuantity: 100,
      description: "A product",
      isActive: true,
    })
    expect(result.success).toBe(true)
  })

  it("applies defaults for optional numeric fields", () => {
    const result = productSchema.safeParse({
      name: "Product",
      categoryId: "cat-1",
      sellingPrice: 15.99,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.costPrice).toBe(0)
      expect(result.data.stockQuantity).toBe(0)
      expect(result.data.minimumStock).toBe(0)
      expect(result.data.isActive).toBe(true)
    }
  })
})

describe("productUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = productUpdateSchema.safeParse({ name: "New Name" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid price", () => {
    const result = productUpdateSchema.safeParse({ sellingPrice: -1 })
    expect(result.success).toBe(false)
  })
})

describe("supplierSchema", () => {
  it("validates supplier with name only", () => {
    const result = supplierSchema.safeParse({ name: "ABC Corp" })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = supplierSchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("accepts optional phone and email", () => {
    const result = supplierSchema.safeParse({
      name: "ABC Corp",
      phone: "+252612345678",
      email: "contact@abc.com",
    })
    expect(result.success).toBe(true)
  })
})

describe("customerSchema", () => {
  it("validates customer with required fields", () => {
    const result = customerSchema.safeParse({
      firstName: "Ahmed",
      phone: "+252612345678",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing firstName", () => {
    const result = customerSchema.safeParse({ phone: "+252612345678" })
    expect(result.success).toBe(false)
  })

  it("rejects negative credit limit", () => {
    const result = customerSchema.safeParse({
      firstName: "Ahmed",
      phone: "+252612345678",
      creditLimit: -100,
    })
    expect(result.success).toBe(false)
  })
})

describe("paginationSchema", () => {
  it("defaults to page 1 limit 20", () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it("accepts custom values", () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(50)
    }
  })

  it("rejects page less than 1", () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects limit over 1000", () => {
    const result = paginationSchema.safeParse({ limit: 1001 })
    expect(result.success).toBe(false)
  })
})

describe("saleSchema items", () => {
  it("validates valid sale items", () => {
    const result = saleSchema.safeParse({
      items: [
        { productId: "p1", productName: "Item1", quantity: 2, unitPrice: 10, discount: 0 },
      ],
      paymentMethod: "CASH",
      amountPaid: 20,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty items", () => {
    const result = saleSchema.safeParse({
      items: [],
      paymentMethod: "CASH",
      amountPaid: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects zero quantity", () => {
    const result = saleSchema.safeParse({
      items: [
        { productId: "p1", productName: "Item1", quantity: 0, unitPrice: 10 },
      ],
      paymentMethod: "CASH",
      amountPaid: 0,
    })
    expect(result.success).toBe(false)
  })
})
