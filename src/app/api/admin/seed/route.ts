import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function randomDate(daysAgo: number): Date {
  const now = new Date()
  const past = new Date(now.getTime() - daysAgo * 86400000)
  return new Date(past.getTime() + Math.random() * 86400000)
}

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, storeId: true },
    })
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let store = null
    if (user.storeId) {
      store = await prisma.store.findUnique({ where: { id: user.storeId } })
    }
    if (!store) {
      store = await prisma.store.findFirst({ where: { ownerId: user.id } })
    }
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const existingProducts = await prisma.product.count({ where: { storeId: store.id } })
    if (existingProducts > 0) {
      return NextResponse.json({
        status: "already_seeded",
        storeName: store.name,
        products: existingProducts,
      })
    }

    const productData = [
      { name: "Basmati Rice 5kg", barcode: "6901234567001", price: 12.5, cost: 9.0, stock: 85, min: 20, unit: "bag", brand: "India Gate", category: "Rice & Grains" },
      { name: "Basmati Rice 1kg", barcode: "6901234567002", price: 3.0, cost: 2.0, stock: 150, min: 30, unit: "bag", brand: "India Gate", category: "Rice & Grains" },
      { name: "Pasta (Spaghetti) 500g", barcode: "8001234567001", price: 1.5, cost: 0.8, stock: 200, min: 40, unit: "pack", brand: "Barilla", category: "Rice & Grains" },
      { name: "Pasta (Macaroni) 500g", barcode: "8001234567002", price: 1.5, cost: 0.8, stock: 180, min: 40, unit: "pack", brand: "Barilla", category: "Rice & Grains" },
      { name: "All Purpose Flour 2kg", barcode: "6901234567010", price: 2.8, cost: 1.8, stock: 120, min: 30, unit: "bag", brand: "Xawaash", category: "Rice & Grains" },
      { name: "Corn Flour 1kg", barcode: "6901234567011", price: 1.8, cost: 1.0, stock: 90, min: 20, unit: "pack", brand: "Afri", category: "Rice & Grains" },
      { name: "Vermicelli 400g", barcode: "6901234567012", price: 1.6, cost: 0.9, stock: 75, min: 15, unit: "pack", brand: "Xawaash", category: "Rice & Grains" },
      { name: "Sunflower Oil 1L", barcode: "6901234567020", price: 3.5, cost: 2.2, stock: 100, min: 25, unit: "bottle", brand: "Afri", category: "Cooking Oils" },
      { name: "Sunflower Oil 3L", barcode: "6901234567021", price: 9.0, cost: 6.0, stock: 45, min: 10, unit: "bottle", brand: "Afri", category: "Cooking Oils" },
      { name: "Olive Oil 500ml", barcode: "8001234567020", price: 6.5, cost: 4.5, stock: 35, min: 10, unit: "bottle", brand: "Munda", category: "Cooking Oils" },
      { name: "Palm Oil 1L", barcode: "6901234567022", price: 2.8, cost: 1.6, stock: 60, min: 15, unit: "bottle", brand: "Munda", category: "Cooking Oils" },
      { name: "White Sugar 5kg", barcode: "6901234567030", price: 5.5, cost: 3.5, stock: 110, min: 20, unit: "bag", brand: "Kasuku", category: "Sugar & Sweeteners" },
      { name: "White Sugar 1kg", barcode: "6901234567031", price: 1.5, cost: 0.9, stock: 180, min: 40, unit: "bag", brand: "Kasuku", category: "Sugar & Sweeteners" },
      { name: "Brown Sugar 1kg", barcode: "6901234567032", price: 1.8, cost: 1.1, stock: 50, min: 10, unit: "bag", brand: "Tropical", category: "Sugar & Sweeteners" },
      { name: "Honey 500ml", barcode: "6901234567033", price: 8.0, cost: 5.0, stock: 25, min: 5, unit: "jar", brand: "Somali Natural", category: "Sugar & Sweeteners" },
      { name: "Black Tea 250g", barcode: "6901234567040", price: 2.5, cost: 1.5, stock: 95, min: 20, unit: "pack", brand: "Kericho Gold", category: "Tea & Coffee" },
      { name: "Green Tea 25 Bags", barcode: "6901234567041", price: 2.0, cost: 1.2, stock: 65, min: 15, unit: "box", brand: "Lipton", category: "Tea & Coffee" },
      { name: "Nescafe Classic 100g", barcode: "8001234567040", price: 5.5, cost: 3.8, stock: 40, min: 10, unit: "jar", brand: "Nescafe", category: "Tea & Coffee" },
      { name: "Turkish Coffee 250g", barcode: "6901234567042", price: 4.0, cost: 2.5, stock: 30, min: 8, unit: "pack", brand: "Kurukahveci Mehmet Efendi", category: "Tea & Coffee" },
      { name: "Cardamom Tea Mix 100g", barcode: "6901234567043", price: 3.5, cost: 2.0, stock: 45, min: 10, unit: "pack", brand: "Xawaash", category: "Tea & Coffee" },
      { name: "Tuna in Oil 185g", barcode: "6901234567050", price: 1.8, cost: 1.0, stock: 150, min: 30, unit: "can", brand: "Fishco", category: "Canned Goods" },
      { name: "Sardines in Tomato 155g", barcode: "6901234567051", price: 1.2, cost: 0.6, stock: 120, min: 25, unit: "can", brand: "Fishco", category: "Canned Goods" },
      { name: "Baked Beans 400g", barcode: "6901234567052", price: 1.5, cost: 0.8, stock: 80, min: 20, unit: "can", brand: "Heinz", category: "Canned Goods" },
      { name: "Chickpeas 400g", barcode: "6901234567053", price: 1.3, cost: 0.7, stock: 90, min: 20, unit: "can", brand: "Africa's Best", category: "Canned Goods" },
      { name: "Tomato Paste 200g", barcode: "6901234567054", price: 1.0, cost: 0.4, stock: 200, min: 40, unit: "pack", brand: "Afri", category: "Canned Goods" },
      { name: "Mixed Vegetables 400g", barcode: "6901234567055", price: 1.4, cost: 0.8, stock: 60, min: 15, unit: "can", brand: "Africa's Best", category: "Canned Goods" },
      { name: "Table Salt 1kg", barcode: "6901234567060", price: 0.8, cost: 0.3, stock: 200, min: 40, unit: "pack", brand: "Cerebos", category: "Spices & Seasonings" },
      { name: "Black Pepper 100g", barcode: "6901234567061", price: 2.5, cost: 1.5, stock: 45, min: 10, unit: "pack", brand: "Tropical", category: "Spices & Seasonings" },
      { name: "Cumin Powder 100g", barcode: "6901234567062", price: 2.0, cost: 1.2, stock: 40, min: 10, unit: "pack", brand: "Xawaash", category: "Spices & Seasonings" },
      { name: "Curry Powder 100g", barcode: "6901234567063", price: 2.2, cost: 1.3, stock: 35, min: 8, unit: "pack", brand: "Tropical", category: "Spices & Seasonings" },
      { name: "Bouillon Cubes (10)", barcode: "6901234567064", price: 1.2, cost: 0.6, stock: 100, min: 20, unit: "box", brand: "Maggi", category: "Spices & Seasonings" },
      { name: "Fresh Milk 1L", barcode: "6901234567070", price: 2.0, cost: 1.3, stock: 60, min: 15, unit: "carton", brand: "Hormuud", category: "Dairy & Eggs" },
      { name: "Powdered Milk 400g", barcode: "6901234567071", price: 5.5, cost: 3.8, stock: 50, min: 12, unit: "tin", brand: "Nido", category: "Dairy & Eggs" },
      { name: "Yogurt 500g", barcode: "6901234567072", price: 1.8, cost: 1.0, stock: 40, min: 10, unit: "cup", brand: "Hormuud", category: "Dairy & Eggs" },
      { name: "Eggs (30 pack)", barcode: "6901234567073", price: 4.5, cost: 3.0, stock: 30, min: 8, unit: "tray", brand: "Local", category: "Dairy & Eggs" },
      { name: "Butter 200g", barcode: "6901234567074", price: 3.0, cost: 2.0, stock: 25, min: 6, unit: "pack", brand: "Manda", category: "Dairy & Eggs" },
      { name: "Water 1.5L", barcode: "6901234567080", price: 0.5, cost: 0.2, stock: 300, min: 60, unit: "bottle", brand: "Mogadishu Water", category: "Beverages" },
      { name: "Water 500ml (24 pack)", barcode: "6901234567081", price: 8.0, cost: 5.5, stock: 25, min: 5, unit: "pack", brand: "Mogadishu Water", category: "Beverages" },
      { name: "Coca-Cola 330ml", barcode: "6901234567082", price: 0.8, cost: 0.4, stock: 120, min: 25, unit: "can", brand: "Coca-Cola", category: "Beverages" },
      { name: "Fanta Orange 330ml", barcode: "6901234567083", price: 0.8, cost: 0.4, stock: 100, min: 20, unit: "can", brand: "Fanta", category: "Beverages" },
      { name: "Mango Juice 1L", barcode: "6901234567084", price: 2.5, cost: 1.5, stock: 45, min: 10, unit: "carton", brand: "Pick N Peel", category: "Beverages" },
      { name: "Energy Drink 250ml", barcode: "6901234567085", price: 1.5, cost: 0.8, stock: 80, min: 15, unit: "can", brand: "Sting", category: "Beverages" },
      { name: "White Bread Loaf", barcode: "6901234567090", price: 1.0, cost: 0.5, stock: 50, min: 15, unit: "loaf", brand: "Sahan", category: "Bread & Bakery" },
      { name: "Flatbread (Sabaad)", barcode: "6901234567091", price: 0.5, cost: 0.2, stock: 80, min: 20, unit: "piece", brand: "Local Bakery", category: "Bread & Bakery" },
      { name: "Digestive Biscuits 200g", barcode: "8001234567090", price: 1.5, cost: 0.8, stock: 60, min: 12, unit: "pack", brand: "McVitie's", category: "Bread & Bakery" },
      { name: "Cereals 375g", barcode: "6901234567092", price: 4.0, cost: 2.5, stock: 30, min: 8, unit: "box", brand: "Kellogg's", category: "Bread & Bakery" },
      { name: "Laundry Detergent 1kg", barcode: "6901234567100", price: 3.5, cost: 2.0, stock: 80, min: 15, unit: "pack", brand: "OMO", category: "Cleaning Supplies" },
      { name: "Dish Soap 500ml", barcode: "6901234567101", price: 1.5, cost: 0.7, stock: 90, min: 20, unit: "bottle", brand: "Sunlight", category: "Cleaning Supplies" },
      { name: "Bleach 1L", barcode: "6901234567102", price: 1.2, cost: 0.5, stock: 60, min: 12, unit: "bottle", brand: "Klin", category: "Cleaning Supplies" },
      { name: "Trash Bags (30)", barcode: "6901234567103", price: 2.0, cost: 1.0, stock: 50, min: 10, unit: "pack", brand: "Glad", category: "Cleaning Supplies" },
      { name: "Sponges (3 pack)", barcode: "6901234567104", price: 1.0, cost: 0.4, stock: 70, min: 15, unit: "pack", brand: "Scotch-Brite", category: "Cleaning Supplies" },
      { name: "Shampoo 400ml", barcode: "6901234567110", price: 3.5, cost: 2.0, stock: 45, min: 10, unit: "bottle", brand: "Head & Shoulders", category: "Personal Care" },
      { name: "Body Soap 100g", barcode: "6901234567111", price: 1.0, cost: 0.4, stock: 120, min: 25, unit: "bar", brand: "Dettol", category: "Personal Care" },
      { name: "Toothpaste 100ml", barcode: "6901234567112", price: 2.0, cost: 1.0, stock: 70, min: 15, unit: "tube", brand: "Colgate", category: "Personal Care" },
      { name: "Toothbrush", barcode: "6901234567113", price: 1.2, cost: 0.5, stock: 80, min: 20, unit: "piece", brand: "Oral-B", category: "Personal Care" },
      { name: "Deodorant 50ml", barcode: "6901234567114", price: 2.8, cost: 1.5, stock: 35, min: 8, unit: "piece", brand: "Nivea", category: "Personal Care" },
      { name: "Diapers Medium (30)", barcode: "6901234567120", price: 8.5, cost: 5.5, stock: 40, min: 10, unit: "pack", brand: "Pampers", category: "Baby Products" },
      { name: "Diapers Large (26)", barcode: "6901234567121", price: 9.0, cost: 6.0, stock: 35, min: 8, unit: "pack", brand: "Pampers", category: "Baby Products" },
      { name: "Baby Formula 400g", barcode: "6901234567122", price: 7.5, cost: 5.0, stock: 25, min: 6, unit: "tin", brand: "NAN", category: "Baby Products" },
      { name: "Baby Wipes (80)", barcode: "6901234567123", price: 2.0, cost: 1.0, stock: 55, min: 12, unit: "pack", brand: "Pampers", category: "Baby Products" },
    ]

    await prisma.store.update({
      where: { id: store.id },
      data: { name: "Hassan Supermarket" },
    })
    await prisma.storeSetting.upsert({
      where: { storeId: store.id },
      create: { storeId: store.id, address: "Maka Al-Mukarama Road, Mogadishu, Somalia", phone: "+252 61 555 1234", currency: "USD", timezone: "Africa/Mogadishu", dateFormat: "DD/MM/YYYY", lowStockAlert: true, salesNotification: true, emailNotification: false },
      update: { address: "Maka Al-Mukarama Road, Mogadishu, Somalia", phone: "+252 61 555 1234", currency: "USD", timezone: "Africa/Mogadishu" },
    })

    const catNames = [...new Set(productData.map((p) => p.category))]
    const catIds: Record<string, string> = {}
    for (const name of catNames) {
      const cat = await prisma.category.create({ data: { name, storeId: store.id, isActive: true } })
      catIds[name] = cat.id
    }

    const productIds: Array<{ id: string; name: string; price: number; cost: number; stock: number; barcode: string }> = []
    for (const p of productData) {
      const created = await prisma.product.create({
        data: {
          name: p.name, barcode: p.barcode, sellingPrice: p.price, costPrice: p.cost,
          stockQuantity: p.stock, minimumStock: p.min, unit: p.unit, brand: p.brand,
          isActive: true, storeId: store.id, categoryId: catIds[p.category],
        },
      })
      productIds.push({ id: created.id, name: p.name, price: p.price, cost: p.cost, stock: p.stock, barcode: p.barcode })
    }

    const supplierData = [
      { name: "Hormuud Trading Co.", phone: "+252 61 222 1001", email: "hormuud@example.com", address: "Industrial Road, Mogadishu" },
      { name: "Somali Wholesalers Ltd", phone: "+252 61 222 1002", email: "somaliwholesale@example.com", address: "Karaan District, Mogadishu" },
      { name: "Banaadir Food Importers", phone: "+252 61 222 1003", email: "banaadir@example.com", address: "Hamar Weyne, Mogadishu" },
      { name: "East Africa Distributors", phone: "+252 61 222 1004", email: "eastafrica@example.com", address: "Bondhere, Mogadishu" },
    ]
    const suppliers: Array<{ id: string; name: string }> = []
    for (const s of supplierData) {
      const created = await prisma.supplier.create({ data: { ...s, isActive: true, storeId: store.id } })
      suppliers.push({ id: created.id, name: s.name })
    }

    const customerData = [
      { firstName: "Ahmed", lastName: "Hassan", phone: "+252 61 333 1001", creditLimit: 500, address: "Hamar Weyne District" },
      { firstName: "Fatima", lastName: "Ali", phone: "+252 61 333 1002", creditLimit: 300, address: "Karaan District" },
      { firstName: "Omar", lastName: "Mohamed", phone: "+252 61 333 1003", creditLimit: 1000, address: "Wadajir District" },
      { firstName: "Amina", lastName: "Ibrahim", phone: "+252 61 333 1004", creditLimit: 200, address: "Shangani District" },
      { firstName: "Hassan", lastName: "Abdi", phone: "+252 61 333 1005", creditLimit: 750, address: "Hodan District" },
      { firstName: "Khadija", lastName: "Warsame", phone: "+252 61 333 1006", creditLimit: 400, address: "Yaqshid District" },
      { firstName: "Abdullahi", lastName: "Noor", phone: "+252 61 333 1007", creditLimit: 600, address: "Abudwaq District" },
      { firstName: "Sahra", lastName: "Yusuf", phone: "+252 61 333 1008", creditLimit: 250, address: "Bondhere District" },
      { firstName: "Ismail", lastName: "Farah", phone: "+252 61 333 1009", creditLimit: 800, address: "Dharkenley District" },
      { firstName: "Maryam", lastName: "Said", phone: "+252 61 333 1010", creditLimit: 350, address: "Waberi District" },
      { firstName: "Liban", lastName: "Ahmed", phone: "+252 61 333 1011", creditLimit: 0, address: "Hamar Jajab District" },
      { firstName: "Zahra", lastName: "Hussein", phone: "+252 61 333 1012", creditLimit: 0, address: "Wardhigley District" },
    ]
    const customers: Array<{ id: string; firstName: string; lastName: string; phone: string; creditLimit: number }> = []
    for (let i = 0; i < customerData.length; i++) {
      const c = customerData[i]
      const created = await prisma.customer.create({
        data: { ...c, customerCode: `CUST-${String(i + 1).padStart(6, "0")}`, isActive: true, storeId: store.id },
      })
      customers.push({ id: created.id, ...c })
    }

    const purchaseInvoices = [
      { invoice: "INV-2026-001", supplierIdx: 0, daysAgo: 28, status: "COMPLETED" as const, items: [{ prodIdx: 0, qty: 50, cost: 9.0 }, { prodIdx: 1, qty: 100, cost: 2.0 }, { prodIdx: 7, qty: 30, cost: 2.2 }, { prodIdx: 20, qty: 80, cost: 1.0 }, { prodIdx: 21, qty: 60, cost: 0.6 }] },
      { invoice: "INV-2026-002", supplierIdx: 1, daysAgo: 21, status: "COMPLETED" as const, items: [{ prodIdx: 2, qty: 100, cost: 0.8 }, { prodIdx: 3, qty: 80, cost: 0.8 }, { prodIdx: 15, qty: 40, cost: 1.5 }, { prodIdx: 24, qty: 120, cost: 0.4 }, { prodIdx: 39, qty: 60, cost: 5.5 }] },
      { invoice: "INV-2026-003", supplierIdx: 2, daysAgo: 14, status: "COMPLETED" as const, items: [{ prodIdx: 11, qty: 60, cost: 3.5 }, { prodIdx: 12, qty: 100, cost: 0.9 }, { prodIdx: 30, qty: 30, cost: 3.8 }, { prodIdx: 31, qty: 25, cost: 1.0 }, { prodIdx: 41, qty: 40, cost: 0.5 }] },
      { invoice: "INV-2026-004", supplierIdx: 3, daysAgo: 7, status: "COMPLETED" as const, items: [{ prodIdx: 36, qty: 80, cost: 0.4 }, { prodIdx: 37, qty: 60, cost: 0.4 }, { prodIdx: 44, qty: 40, cost: 0.4 }, { prodIdx: 45, qty: 50, cost: 1.0 }, { prodIdx: 46, qty: 30, cost: 0.5 }] },
      { invoice: "INV-2026-005", supplierIdx: 0, daysAgo: 3, status: "COMPLETED" as const, items: [{ prodIdx: 4, qty: 40, cost: 1.8 }, { prodIdx: 8, qty: 15, cost: 6.0 }, { prodIdx: 48, qty: 20, cost: 5.5 }, { prodIdx: 49, qty: 15, cost: 6.0 }, { prodIdx: 50, qty: 10, cost: 5.0 }] },
    ]
    for (const p of purchaseInvoices) {
      const purchaseTotal = p.items.reduce((sum, item) => sum + item.qty * item.cost, 0)
      await prisma.purchase.create({
        data: {
          invoiceNumber: p.invoice, supplierName: suppliers[p.supplierIdx].name, supplierId: suppliers[p.supplierIdx].id,
          total: purchaseTotal, status: p.status, notes: "Regular stock replenishment", storeId: store.id,
          createdAt: randomDate(p.daysAgo),
          items: { create: p.items.map((item) => ({ productId: productIds[item.prodIdx].id, productName: productIds[item.prodIdx].name, quantity: item.qty, costPrice: item.cost, unitName: "pcs", unitConversionFactor: 1 })) },
        },
      })
    }

    const payMethods = ["CASH", "CASH", "CASH", "CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CASH", "CASH", "CREDIT", "CREDIT"] as const
    const saleNumbers: string[] = []
    const sales: Array<{ id: string; total: number; cost: number; method: string; customerId: string | null; amountPaid: number }> = []
    let saleCounter = 0

    for (let day = 30; day >= 0; day--) {
      const salesPerDay = day === 0 ? 5 : Math.floor(Math.random() * 4) + 2
      for (let s = 0; s < salesPerDay; s++) {
        const payMethod = payMethods[Math.floor(Math.random() * payMethods.length)] as string
        const useCustomer = payMethod === "CREDIT" || (payMethod !== "CREDIT" && Math.random() > 0.6)
        const customer = useCustomer ? customers[Math.floor(Math.random() * customers.length)] : null

        const itemCount = Math.floor(Math.random() * 5) + 1
        const selectedProducts = new Set<number>()
        const items: Array<{ prodIdx: number; qty: number; unitPrice: number; discount: number }> = []

        while (items.length < itemCount && selectedProducts.size < productIds.length) {
          const prodIdx = Math.floor(Math.random() * productIds.length)
          if (selectedProducts.has(prodIdx)) continue
          selectedProducts.add(prodIdx)
          const maxQty = Math.min(productIds[prodIdx].stock, 5)
          if (maxQty <= 0) continue
          const qty = Math.floor(Math.random() * maxQty) + 1
          const discount = Math.random() > 0.8 ? randomAmount(0.1, 0.5) : 0
          items.push({ prodIdx, qty, unitPrice: productIds[prodIdx].price, discount })
        }
        if (items.length === 0) continue

        let grandTotal = 0
        let totalCost = 0
        for (const item of items) {
          const lineTotal = item.unitPrice * item.qty - item.discount
          grandTotal += Math.max(0, lineTotal)
          totalCost += productIds[item.prodIdx].cost * item.qty
        }
        grandTotal = Math.round(grandTotal * 100) / 100
        totalCost = Math.round(totalCost * 100) / 100

        const taxAmount = 0
        const saleDiscount = 0
        const finalTotal = Math.round((grandTotal + taxAmount - saleDiscount) * 100) / 100

        let amountPaid: number
        if (payMethod === "CREDIT") {
          amountPaid = randomAmount(finalTotal * 0.3, finalTotal * 0.7)
        } else {
          amountPaid = finalTotal
        }

        const saleDate = randomDate(day)
        const saleNumber = `SALE-${String(saleCounter + 1).padStart(6, "0")}`
        saleCounter++
        saleNumbers.push(saleNumber)

        const sale = await prisma.sale.create({
          data: {
            saleNumber, storeId: store.id, subtotal: grandTotal, tax: taxAmount, discount: saleDiscount,
            total: finalTotal, amountPaid, paymentMethod: payMethod, status: "COMPLETED",
            customerId: customer?.id || null, customerName: customer ? `${customer.firstName} ${customer.lastName}` : null,
            createdBy: user.id, createdAt: saleDate,
            saleNumberIndex: saleCounter,
          },
        })

        let prevStocks: number[] = []
        for (const item of items) {
          const p = productIds[item.prodIdx]
          const prevStock = p.stock
          const newStock = Math.max(0, prevStock - item.qty)
          prevStocks.push(prevStock)
          await prisma.saleItem.create({
            data: {
              saleId: sale.id, productId: p.id, productName: p.name, quantity: item.qty,
              unitPrice: item.unitPrice, discount: item.discount, costPrice: p.cost,
              storeId: store.id,
            },
          })
          await prisma.inventoryTransaction.create({
            data: {
              transactionType: "SALE", quantity: -item.qty, previousStock: prevStock, newStock,
              reason: `Sale ${saleNumber}`, reference: sale.id, storeId: store.id, productId: p.id,
              createdBy: user.id, createdAt: saleDate,
            },
          })
          p.stock = newStock
        }

        await prisma.product.updateMany({
          where: { id: { in: items.map((item) => productIds[item.prodIdx].id) } },
          data: {},
        })

        for (let i = 0; i < items.length; i++) {
          const p = productIds[items[i].prodIdx]
          await prisma.product.update({ where: { id: p.id }, data: { stockQuantity: p.stock } })
        }

        if (customer) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { currentBalance: payMethod === "CREDIT" ? { increment: finalTotal - amountPaid } : undefined },
          })
        }

        sales.push({ id: sale.id, total: finalTotal, cost: totalCost, method: payMethod, customerId: customer?.id || null, amountPaid })
      }
    }

    let creditPaymentCount = 0
    for (const sale of sales) {
      if (sale.method === "CREDIT" && sale.customerId) {
        if (Math.random() > 0.3) {
          const paymentAmount = randomAmount(sale.amountPaid * 0.3, sale.amountPaid)
          await prisma.customerPayment.create({
            data: {
              customerId: sale.customerId, storeId: store.id, amount: paymentAmount,
              paymentMethod: "CASH", saleId: sale.id,
              reference: `Credit payment for ${saleNumbers[sales.indexOf(sale)]}`,
              createdAt: randomDate(Math.floor(Math.random() * 20)),
            },
          })
          creditPaymentCount++
        }
      }
    }

    return NextResponse.json({
      status: "seeded",
      storeName: "Hassan Supermarket",
      products: productIds.length,
      categories: catNames.length,
      customers: customers.length,
      suppliers: suppliers.length,
      sales: saleCounter,
      creditPayments: creditPaymentCount,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
