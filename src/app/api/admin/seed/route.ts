import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const categories = [
  { name: "Beverages", description: "Soft drinks, juices, and bottled water", color: "#3B82F6", icon: "drink" },
  { name: "Rice & Pasta", description: "Rice, pasta, flour, and grains", color: "#F59E0B", icon: "grain" },
  { name: "Oil & Canned Goods", description: "Cooking oil, canned foods, and sauces", color: "#F97316", icon: "can" },
  { name: "Spices & Condiments", description: "Spices, salt, sugar, and seasonings", color: "#EF4444", icon: "spice" },
  { name: "Milk & Dairy", description: "Milk, yogurt, cheese, and eggs", color: "#FCD34D", icon: "dairy" },
  { name: "Sweets & Snacks", description: "Biscuits, candies, and packaged snacks", color: "#EC4899", icon: "snack" },
  { name: "Household Items", description: "Soap, detergent, and cleaning supplies", color: "#10B981", icon: "household" },
  { name: "Water & Drinks", description: "Bottled water and energy drinks", color: "#06B6D4", icon: "water" },
]

const products = [
  { category: "Beverages", items: [
    { name: "Coca Cola 330ml", barcode: "5000112642331", sellingPrice: 0.50, costPrice: 0.35, stockQuantity: 200, minimumStock: 50 },
    { name: "Fanta Orange 330ml", barcode: "5000112642430", sellingPrice: 0.50, costPrice: 0.35, stockQuantity: 180, minimumStock: 40 },
    { name: "Sprite 330ml", barcode: "5000112642539", sellingPrice: 0.50, costPrice: 0.35, stockQuantity: 160, minimumStock: 40 },
    { name: "Pepsi 330ml", barcode: "5000121300367", sellingPrice: 0.45, costPrice: 0.30, stockQuantity: 150, minimumStock: 30 },
  ]},
  { category: "Rice & Pasta", items: [
    { name: "Sona Rice 5kg", barcode: "6281007330545", sellingPrice: 7.50, costPrice: 6.00, stockQuantity: 80, minimumStock: 15 },
    { name: "Sona Rice 10kg", barcode: "6281007330552", sellingPrice: 14.00, costPrice: 11.00, stockQuantity: 50, minimumStock: 10 },
    { name: "Spaghetti 500g", barcode: "5200104110345", sellingPrice: 1.00, costPrice: 0.70, stockQuantity: 120, minimumStock: 30 },
    { name: "Macaroni 500g", barcode: "5200104110352", sellingPrice: 1.00, costPrice: 0.70, stockQuantity: 100, minimumStock: 25 },
    { name: "Flour 2kg", barcode: "6281007330569", sellingPrice: 2.50, costPrice: 1.80, stockQuantity: 60, minimumStock: 15 },
  ]},
  { category: "Oil & Canned Goods", items: [
    { name: "Cooking Oil 1L", barcode: "6281007330576", sellingPrice: 3.00, costPrice: 2.20, stockQuantity: 90, minimumStock: 20 },
    { name: "Cooking Oil 3L", barcode: "6281007330583", sellingPrice: 8.00, costPrice: 6.00, stockQuantity: 40, minimumStock: 10 },
    { name: "Canned Tuna", barcode: "8850123456789", sellingPrice: 1.50, costPrice: 1.00, stockQuantity: 100, minimumStock: 25 },
    { name: "Tomato Paste 140g", barcode: "6281007330590", sellingPrice: 0.60, costPrice: 0.40, stockQuantity: 150, minimumStock: 30 },
    { name: "Canned Beans", barcode: "8850123456796", sellingPrice: 1.20, costPrice: 0.80, stockQuantity: 80, minimumStock: 20 },
  ]},
  { category: "Spices & Condiments", items: [
    { name: "Sugar 1kg", barcode: "6281007330606", sellingPrice: 1.20, costPrice: 0.90, stockQuantity: 100, minimumStock: 25 },
    { name: "Sugar 5kg", barcode: "6281007330613", sellingPrice: 5.50, costPrice: 4.00, stockQuantity: 30, minimumStock: 8 },
    { name: "Salt 500g", barcode: "6281007330620", sellingPrice: 0.30, costPrice: 0.20, stockQuantity: 200, minimumStock: 50 },
    { name: "Black Pepper 50g", barcode: "6281007330637", sellingPrice: 0.80, costPrice: 0.50, stockQuantity: 80, minimumStock: 20 },
    { name: "Cumin 50g", barcode: "6281007330644", sellingPrice: 0.70, costPrice: 0.45, stockQuantity: 60, minimumStock: 15 },
    { name: "Tea Bags 100pk", barcode: "6281007330651", sellingPrice: 2.00, costPrice: 1.40, stockQuantity: 70, minimumStock: 15 },
  ]},
  { category: "Milk & Dairy", items: [
    { name: "Fresh Milk 1L", barcode: "6281007330668", sellingPrice: 2.00, costPrice: 1.50, stockQuantity: 60, minimumStock: 15 },
    { name: "Powdered Milk 400g", barcode: "6281007330675", sellingPrice: 4.00, costPrice: 3.00, stockQuantity: 40, minimumStock: 10 },
    { name: "Yogurt 1L", barcode: "6281007330682", sellingPrice: 2.50, costPrice: 1.80, stockQuantity: 30, minimumStock: 8 },
    { name: "Eggs 30pk", barcode: "6281007330699", sellingPrice: 3.50, costPrice: 2.50, stockQuantity: 25, minimumStock: 5 },
  ]},
  { category: "Sweets & Snacks", items: [
    { name: "Biscuits 200g", barcode: "6281007330705", sellingPrice: 0.80, costPrice: 0.50, stockQuantity: 120, minimumStock: 30 },
    { name: "Chocolate Bar", barcode: "6281007330712", sellingPrice: 1.00, costPrice: 0.65, stockQuantity: 90, minimumStock: 20 },
    { name: "Potato Chips 150g", barcode: "6281007330729", sellingPrice: 1.00, costPrice: 0.60, stockQuantity: 80, minimumStock: 20 },
    { name: "Candy Pack", barcode: "6281007330736", sellingPrice: 0.50, costPrice: 0.30, stockQuantity: 150, minimumStock: 40 },
  ]},
  { category: "Household Items", items: [
    { name: "Laundry Soap", barcode: "6281007330743", sellingPrice: 1.50, costPrice: 1.00, stockQuantity: 50, minimumStock: 12 },
    { name: "Dish Soap 500ml", barcode: "6281007330750", sellingPrice: 1.00, costPrice: 0.65, stockQuantity: 60, minimumStock: 15 },
    { name: "Bleach 1L", barcode: "6281007330767", sellingPrice: 1.20, costPrice: 0.80, stockQuantity: 40, minimumStock: 10 },
    { name: "Toilet Cleaner", barcode: "6281007330774", sellingPrice: 1.50, costPrice: 1.00, stockQuantity: 35, minimumStock: 8 },
  ]},
  { category: "Water & Drinks", items: [
    { name: "Bottled Water 500ml", barcode: "6281007330781", sellingPrice: 0.25, costPrice: 0.15, stockQuantity: 300, minimumStock: 100 },
    { name: "Bottled Water 1.5L", barcode: "6281007330798", sellingPrice: 0.40, costPrice: 0.25, stockQuantity: 200, minimumStock: 60 },
    { name: "Energy Drink 250ml", barcode: "6281007330804", sellingPrice: 1.50, costPrice: 1.00, stockQuantity: 70, minimumStock: 20 },
  ]},
]

const customers = [
  { firstName: "Ahmed", lastName: "Mohamed", phone: "+252611000001", email: "ahmed@example.com" },
  { firstName: "Fatima", lastName: "Ali", phone: "+252611000002", email: "fatima@example.com" },
  { firstName: "Hassan", lastName: "Hussein", phone: "+252611000003" },
  { firstName: "Amina", lastName: "Osman", phone: "+252611000004" },
  { firstName: "Mohamed", lastName: "Ibrahim", phone: "+252611000005" },
  { firstName: "Safia", lastName: "Abdullahi", phone: "+252611000006" },
  { firstName: "Abdirahman", lastName: "Farah", phone: "+252611000007" },
  { firstName: "Khadija", lastName: "Warsame", phone: "+252611000008" },
  { firstName: "Ali", lastName: "Yusuf", phone: "+252611000009" },
  { firstName: "Nasra", lastName: "Abdi", phone: "+252611000010" },
]

const suppliers = [
  { name: "Somalia Imports LLC", phone: "+252600000001", email: "info@somaliaimports.so" },
  { name: "Horn Trading Co", phone: "+252600000002", email: "orders@horntrading.so" },
  { name: "Red Sea Wholesalers", phone: "+252600000003", email: "sales@redseawholesale.so" },
  { name: "Mogadishu Distributors", phone: "+252600000004", email: "info@mogadistributors.so" },
  { name: "East African Supply", phone: "+252600000005", email: "contact@eastafricansupply.so" },
]

const paymentMethods = ["SAHAL", "ZAAD", "CASH", "EVC_PLUS", "CARD"] as const
type PaymentMethod = (typeof paymentMethods)[number]

function randomItem<T extends readonly unknown[]>(arr: T): T[number] {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - randomInt(0, daysAgo))
  d.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0)
  return d
}

export async function POST() {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()

    const existingCategories = await prisma.category.count({ where: { storeId: store.id } })
    if (existingCategories > 0) {
      return NextResponse.json(
        { error: "This store already has data. Seed is only available for empty stores." },
        { status: 409 }
      )
    }

    const createdCategories: Record<string, string> = {}
    for (const cat of categories) {
      const created = await prisma.category.create({
        data: { name: cat.name, description: cat.description, color: cat.color, icon: cat.icon, storeId: store.id },
      })
      createdCategories[cat.name] = created.id
    }

    const createdProductIds: string[] = []
    for (const group of products) {
      const categoryId = createdCategories[group.category]
      for (const p of group.items) {
        const product = await prisma.product.create({
          data: {
            name: p.name,
            barcode: p.barcode,
            sellingPrice: p.sellingPrice,
            costPrice: p.costPrice,
            stockQuantity: p.stockQuantity,
            minimumStock: p.minimumStock,
            unit: "pcs",
            categoryId,
            storeId: store.id,
          },
        })
        createdProductIds.push(product.id)
      }
    }

    const createdCustomerIds: string[] = []
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i]
      const code = `CUST-${String(i + 1).padStart(6, "0")}`
      const customer = await prisma.customer.create({
        data: {
          customerCode: code,
          firstName: c.firstName,
          lastName: c.lastName || "",
          phone: c.phone,
          email: c.email || null,
          storeId: store.id,
        },
      })
      createdCustomerIds.push(customer.id)
    }

    const createdSupplierIds: string[] = []
    for (const s of suppliers) {
      const supplier = await prisma.supplier.create({
        data: { name: s.name, phone: s.phone, email: s.email || null, storeId: store.id },
      })
      createdSupplierIds.push(supplier.id)
    }

    const purchases: Array<{ supplierId: string; items: Array<{ productId: string; costPrice: number; quantity: number }> }> = []
    for (let i = 0; i < 8; i++) {
      const numItems = randomInt(2, 5)
      const items = []
      for (let j = 0; j < numItems; j++) {
        const productId = randomItem(createdProductIds)
        const productInfo = products.flatMap(g => g.items).find(p => {
          const idx = products.flatMap(g => g.items).indexOf(p)
          return idx < createdProductIds.length
        })
        const idx = createdProductIds.indexOf(productId)
        const allItems = products.flatMap(g => g.items)
        const pinfo = allItems[idx] || allItems[0]
        items.push({
          productId,
          costPrice: pinfo.costPrice,
          quantity: randomInt(10, 50),
        })
      }
      purchases.push({
        supplierId: randomItem(createdSupplierIds),
        items,
      })
    }

    for (let i = 0; i < purchases.length; i++) {
      const p = purchases[i]
      const total = p.items.reduce((sum, item) => sum + item.costPrice * item.quantity, 0)
      const purchaseDate = randomDate(60)

      const purchase = await prisma.purchase.create({
        data: {
          invoiceNumber: `PO-${String(i + 1).padStart(6, "0")}`,
          supplierId: p.supplierId,
          supplierName: suppliers[createdSupplierIds.indexOf(p.supplierId)]?.name || "Supplier",
          notes: "Demo purchase",
          total,
          status: "COMPLETED",
          storeId: store.id,
          createdAt: purchaseDate,
          items: {
            create: p.items.map((item) => {
              const allProducts = products.flatMap(g => g.items)
              const productIdx = createdProductIds.indexOf(item.productId)
              const productInfo = allProducts[productIdx] || allProducts[0]
              return {
                productId: item.productId,
                productName: productInfo.name,
                quantity: item.quantity,
                costPrice: item.costPrice,
                unitName: "pcs",
                unitConversionFactor: 1,
              }
            }),
          },
        },
      })

      for (const item of p.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })
        const product = products.flatMap(g => g.items)[createdProductIds.indexOf(item.productId)]
        await prisma.inventoryTransaction.create({
          data: {
            transactionType: "IN",
            quantity: item.quantity,
            previousStock: 0,
            newStock: item.quantity,
            reason: `Purchase #PO-${String(i + 1).padStart(6, "0")}`,
            reference: `PO-${String(i + 1).padStart(6, "0")}`,
            storeId: store.id,
            productId: item.productId,
            createdBy: auth.userId,
            purchaseId: purchase.id,
          },
        })
      }
    }

    for (let i = 0; i < 15; i++) {
      const numItems = randomInt(1, 4)
      const items = []
      let subtotal = 0
      for (let j = 0; j < numItems; j++) {
        const productId = randomItem(createdProductIds)
        const allItems = products.flatMap(g => g.items)
        const productIdx = createdProductIds.indexOf(productId)
        const productInfo = allItems[productIdx] || allItems[0]
        const qty = randomInt(1, 5)
        items.push({
          productId,
          productName: productInfo.name,
          barcode: productInfo.barcode,
          quantity: qty,
          unitPrice: productInfo.sellingPrice,
          discount: 0,
          total: qty * productInfo.sellingPrice,
          unitName: "pcs",
          unitConversionFactor: 1,
        })
        subtotal += qty * productInfo.sellingPrice
      }
      const discount = Math.random() > 0.7 ? randomInt(1, 5) : 0
      const total = subtotal - discount
      const payment = randomItem(paymentMethods)
      const saleDate = randomDate(30)

      const lastSale = await prisma.sale.findFirst({
        where: { storeId: store.id },
        orderBy: { saleNumber: "desc" },
      })
      let nextNum = 1
      if (lastSale) {
        const num = parseInt(lastSale.saleNumber.replace("SALE-", ""), 10)
        if (!isNaN(num)) nextNum = num + 1
      }
      const saleNumber = `SALE-${String(nextNum).padStart(6, "0")}`

      const sale = await prisma.sale.create({
        data: {
          saleNumber,
          subtotal,
          discount,
          tax: 0,
          total,
          amountPaid: total,
          changeGiven: 0,
          paymentMethod: payment,
          status: "COMPLETED",
          storeId: store.id,
          customerId: createdCustomerIds.length > 0 ? randomItem(createdCustomerIds) : undefined,
          cashierId: auth.userId,
          createdAt: saleDate,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              barcode: item.barcode || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total,
              unitName: item.unitName,
              unitConversionFactor: item.unitConversionFactor,
            })),
          },
        },
      })

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        if (product) {
          const newStock = product.stockQuantity - item.quantity
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          })
          await prisma.inventoryTransaction.create({
            data: {
              transactionType: "OUT",
              quantity: item.quantity,
              previousStock: product.stockQuantity,
              newStock,
              reason: `Sale #${saleNumber}`,
              reference: saleNumber,
              storeId: store.id,
              productId: item.productId,
              createdBy: auth.userId,
            },
          })
        }
      }
    }

    const categoryCount = await prisma.category.count({ where: { storeId: store.id } })
    const productCount = await prisma.product.count({ where: { storeId: store.id } })
    const customerCount = await prisma.customer.count({ where: { storeId: store.id } })
    const supplierCount = await prisma.supplier.count({ where: { storeId: store.id } })
    const saleCount = await prisma.sale.count({ where: { storeId: store.id } })
    const purchaseCount = await prisma.purchase.count({ where: { storeId: store.id } })

    logger.info("Store seeded with demo data", {
      storeId: store.id,
      categories: categoryCount,
      products: productCount,
      customers: customerCount,
      suppliers: supplierCount,
      sales: saleCount,
      purchases: purchaseCount,
    })

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      counts: {
        categories: categoryCount,
        products: productCount,
        customers: customerCount,
        suppliers: supplierCount,
        sales: saleCount,
        purchases: purchaseCount,
      },
    })
  } catch (error) {
    logger.error("Seed error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
