import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function randomDate(daysAgo: number): Date {
  const now = new Date()
  const past = new Date(now.getTime() - daysAgo * 86400000)
  return new Date(past.getTime() + Math.random() * 86400000)
}

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100
}

async function main() {
  console.log("=== SEEDING COMPLETE BUSINESS DATA ===\n")

  const userEmail = "mahamutmahamet43@gmail.com"
  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) {
    console.error(`User ${userEmail} not found. Please register first.`)
    process.exit(1)
  }

  const store = await prisma.store.findFirst({
    where: { OR: [{ ownerId: user.id }, { id: user.storeId || "" }] },
  })
  if (!store) {
    console.error("Store not found for this user.")
    process.exit(1)
  }
  console.log(`Store: ${store.name} (${store.id})`)

  const hasProducts = await prisma.product.count({ where: { storeId: store.id } })
  if (hasProducts > 0) {
    console.log(`Store already has ${hasProducts} products. Clearing existing data...`)
    await prisma.customerPayment.deleteMany({ where: { storeId: store.id } })
    await prisma.inventoryTransaction.deleteMany({ where: { storeId: store.id } })
    await prisma.saleItem.deleteMany({ where: { sale: { storeId: store.id } } })
    await prisma.sale.deleteMany({ where: { storeId: store.id } })
    await prisma.purchaseItem.deleteMany({ where: { purchase: { storeId: store.id } } })
    await prisma.purchase.deleteMany({ where: { storeId: store.id } })
    await prisma.productUnit.deleteMany({ where: { product: { storeId: store.id } } })
    await prisma.product.deleteMany({ where: { storeId: store.id } })
    await prisma.category.deleteMany({ where: { storeId: store.id } })
    await prisma.customer.deleteMany({ where: { storeId: store.id } })
    await prisma.supplier.deleteMany({ where: { storeId: store.id } })
    console.log("Existing data cleared.\n")
  }

  // ─────────────────────────────────────────────
  // 1. STORE SETTINGS
  // ─────────────────────────────────────────────
  console.log("1. Setting up store...")
  await prisma.store.update({
    where: { id: store.id },
    data: { name: "Hassan Supermarket" },
  })
  await prisma.storeSetting.upsert({
    where: { storeId: store.id },
    create: {
      storeId: store.id,
      address: "Maka Al-Mukarama Road, Mogadishu, Somalia",
      phone: "+252 61 555 1234",
      email: userEmail,
      currency: "USD",
      timezone: "Africa/Mogadishu",
      dateFormat: "DD/MM/YYYY",
      lowStockAlert: true,
      salesNotification: true,
      emailNotification: false,
    },
    update: {
      address: "Maka Al-Mukarama Road, Mogadishu, Somalia",
      phone: "+252 61 555 1234",
      email: userEmail,
      currency: "USD",
      timezone: "Africa/Mogadishu",
      dateFormat: "DD/MM/YYYY",
    },
  })
  console.log("  Store settings configured.\n")

  // ─────────────────────────────────────────────
  // 2. CATEGORIES
  // ─────────────────────────────────────────────
  console.log("2. Creating categories...")
  const categoryData = [
    { name: "Rice & Grains", description: "Rice, pasta, flour, and grains", color: "#f59e0b", icon: "🌾" },
    { name: "Cooking Oils", description: "Sunflower, olive, and palm oils", color: "#84cc16", icon: "🫒" },
    { name: "Sugar & Sweeteners", description: "Sugar, honey, and sweeteners", color: "#eab308", icon: "🍯" },
    { name: "Tea & Coffee", description: "Tea leaves, coffee, and beverages", color: "#78350f", icon: "☕" },
    { name: "Canned Goods", description: "Canned fish, meat, vegetables, and beans", color: "#ef4444", icon: "🥫" },
    { name: "Spices & Seasonings", description: "Spices, salt, and seasonings", color: "#f97316", icon: "🧂" },
    { name: "Dairy & Eggs", description: "Milk, yogurt, cheese, and eggs", color: "#3b82f6", icon: "🥛" },
    { name: "Beverages", description: "Water, juice, and soft drinks", color: "#06b6d4", icon: "🥤" },
    { name: "Bread & Bakery", description: "Bread, cookies, and snacks", color: "#a16207", icon: "🍞" },
    { name: "Cleaning Supplies", description: "Soap, detergent, and cleaning", color: "#8b5cf6", icon: "🧹" },
    { name: "Personal Care", description: "Shampoo, soap, and toiletries", color: "#ec4899", icon: "🧴" },
    { name: "Baby Products", description: "Diapers, formula, and baby food", color: "#14b8a6", icon: "👶" },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoryData) {
    const created = await prisma.category.create({
      data: { ...cat, isActive: true, storeId: store.id },
    })
    categories[cat.name] = created.id
    console.log(`  + ${cat.name}`)
  }
  console.log()

  // ─────────────────────────────────────────────
  // 3. PRODUCTS (Realistic Somali Supermarket)
  // ─────────────────────────────────────────────
  console.log("3. Creating products...")
  const productData = [
    // Rice & Grains
    { name: "Basmati Rice 5kg", category: "Rice & Grains", price: 12.50, cost: 9.00, stock: 85, min: 20, barcode: "6901234567001", brand: "India Gate", unit: "bag" },
    { name: "Basmati Rice 1kg", category: "Rice & Grains", price: 3.00, cost: 2.10, stock: 150, min: 30, barcode: "6901234567002", brand: "India Gate", unit: "bag" },
    { name: "Pasta (Spaghetti) 500g", category: "Rice & Grains", price: 1.50, cost: 0.90, stock: 200, min: 40, barcode: "8001234567001", brand: "Barilla", unit: "pack" },
    { name: "Pasta (Macaroni) 500g", category: "Rice & Grains", price: 1.50, cost: 0.90, stock: 180, min: 40, barcode: "8001234567002", brand: "Barilla", unit: "pack" },
    { name: "All Purpose Flour 2kg", category: "Rice & Grains", price: 2.80, cost: 1.80, stock: 120, min: 25, barcode: "6901234567010", brand: "Pembe", unit: "bag" },
    { name: "Corn Flour 1kg", category: "Rice & Grains", price: 1.80, cost: 1.10, stock: 90, min: 20, barcode: "6901234567011", brand: "Pembe", unit: "bag" },
    { name: "Vermicelli 400g", category: "Rice & Grains", price: 1.60, cost: 1.00, stock: 75, min: 15, barcode: "6901234567012", brand: "Benvito", unit: "pack" },

    // Cooking Oils
    { name: "Sunflower Oil 1L", category: "Cooking Oils", price: 3.50, cost: 2.30, stock: 100, min: 25, barcode: "6291234567001", brand: "Rahma", unit: "bottle" },
    { name: "Sunflower Oil 3L", category: "Cooking Oils", price: 9.00, cost: 6.20, stock: 45, min: 10, barcode: "6291234567002", brand: "Rahma", unit: "bottle" },
    { name: "Olive Oil 500ml", category: "Cooking Oils", price: 6.50, cost: 4.50, stock: 35, min: 8, barcode: "6291234567003", brand: "Afia", unit: "bottle" },
    { name: "Palm Oil 1L", category: "Cooking Oils", price: 2.80, cost: 1.80, stock: 60, min: 15, barcode: "6291234567004", brand: "Local", unit: "bottle" },

    // Sugar & Sweeteners
    { name: "White Sugar 5kg", category: "Sugar & Sweeteners", price: 5.50, cost: 3.80, stock: 110, min: 25, barcode: "6901234567020", brand: "Illovo", unit: "bag" },
    { name: "White Sugar 1kg", category: "Sugar & Sweeteners", price: 1.50, cost: 0.95, stock: 180, min: 40, barcode: "6901234567021", brand: "Illovo", unit: "bag" },
    { name: "Brown Sugar 1kg", category: "Sugar & Sweeteners", price: 1.80, cost: 1.20, stock: 50, min: 10, barcode: "6901234567022", brand: "Illovo", unit: "bag" },
    { name: "Honey 500ml", category: "Sugar & Sweeteners", price: 8.00, cost: 5.50, stock: 25, min: 5, barcode: "6901234567023", brand: "Langeno", unit: "bottle" },

    // Tea & Coffee
    { name: "Black Tea 250g", category: "Tea & Coffee", price: 2.50, cost: 1.50, stock: 95, min: 20, barcode: "6901234567030", brand: "Lipton", unit: "pack" },
    { name: "Green Tea 25 Bags", category: "Tea & Coffee", price: 2.00, cost: 1.20, stock: 65, min: 15, barcode: "6901234567031", brand: "Lipton", unit: "box" },
    { name: "Nescafe Classic 100g", category: "Tea & Coffee", price: 5.50, cost: 3.80, stock: 40, min: 10, barcode: "7611234567001", brand: "Nescafe", unit: "jar" },
    { name: "Turkish Coffee 250g", category: "Tea & Coffee", price: 4.00, cost: 2.80, stock: 30, min: 8, barcode: "6901234567033", brand: "Kurukahveci", unit: "pack" },
    { name: "Cardamom Tea Mix 100g", category: "Tea & Coffee", price: 3.50, cost: 2.20, stock: 45, min: 10, barcode: "6901234567034", brand: "Shaafi", unit: "pack" },

    // Canned Goods
    { name: "Tuna in Oil 185g", category: "Canned Goods", price: 1.80, cost: 1.10, stock: 150, min: 30, barcode: "6901234567040", brand: "Semo", unit: "can" },
    { name: "Sardines in Tomato 155g", category: "Canned Goods", price: 1.20, cost: 0.70, stock: 120, min: 25, barcode: "6901234567041", brand: "Semo", unit: "can" },
    { name: "Baked Beans 400g", category: "Canned Goods", price: 1.50, cost: 0.85, stock: 80, min: 20, barcode: "6901234567042", brand: "Heinz", unit: "can" },
    { name: "Chickpeas 400g", category: "Canned Goods", price: 1.30, cost: 0.75, stock: 90, min: 20, barcode: "6901234567043", brand: "Local", unit: "can" },
    { name: "Tomato Paste 200g", category: "Canned Goods", price: 1.00, cost: 0.55, stock: 200, min: 40, barcode: "6901234567044", brand: "Semo", unit: "can" },
    { name: "Mixed Vegetables 400g", category: "Canned Goods", price: 1.40, cost: 0.80, stock: 60, min: 15, barcode: "6901234567045", brand: "Local", unit: "can" },

    // Spices & Seasonings
    { name: "Table Salt 1kg", category: "Spices & Seasonings", price: 0.80, cost: 0.35, stock: 200, min: 50, barcode: "6901234567050", brand: "Local", unit: "pack" },
    { name: "Black Pepper 100g", category: "Spices & Seasonings", price: 2.50, cost: 1.60, stock: 45, min: 10, barcode: "6901234567051", brand: "McCormick", unit: "pack" },
    { name: "Cumin Powder 100g", category: "Spices & Seasonings", price: 2.00, cost: 1.30, stock: 40, min: 10, barcode: "6901234567052", brand: "Local", unit: "pack" },
    { name: "Curry Powder 100g", category: "Spices & Seasonings", price: 2.20, cost: 1.40, stock: 35, min: 8, barcode: "6901234567053", brand: "McCormick", unit: "pack" },
    { name: "Bouillon Cubes (10)", category: "Spices & Seasonings", price: 1.20, cost: 0.65, stock: 100, min: 25, barcode: "6901234567054", brand: "Maggi", unit: "box" },

    // Dairy & Eggs
    { name: "Fresh Milk 1L", category: "Dairy & Eggs", price: 2.00, cost: 1.40, stock: 60, min: 15, barcode: "6901234567060", brand: "Al Safi", unit: "carton" },
    { name: "Powdered Milk 400g", category: "Dairy & Eggs", price: 5.50, cost: 3.80, stock: 50, min: 12, barcode: "6901234567061", brand: "Nido", unit: "tin" },
    { name: "Yogurt 500g", category: "Dairy & Eggs", price: 1.80, cost: 1.10, stock: 40, min: 10, barcode: "6901234567062", brand: "Almarai", unit: "cup" },
    { name: "Eggs (30 pack)", category: "Dairy & Eggs", price: 4.50, cost: 3.20, stock: 30, min: 8, barcode: "6901234567063", brand: "Local", unit: "tray" },
    { name: "Butter 200g", category: "Dairy & Eggs", price: 3.00, cost: 2.00, stock: 25, min: 5, barcode: "6901234567064", brand: "Lurpak", unit: "pack" },

    // Beverages
    { name: "Water 1.5L", category: "Beverages", price: 0.50, cost: 0.20, stock: 300, min: 60, barcode: "6901234567070", brand: "Nestle", unit: "bottle" },
    { name: "Water 500ml (24 pack)", category: "Beverages", price: 8.00, cost: 5.50, stock: 25, min: 5, barcode: "6901234567071", brand: "Nestle", unit: "pack" },
    { name: "Coca-Cola 330ml", category: "Beverages", price: 0.80, cost: 0.45, stock: 120, min: 30, barcode: "5441234567001", brand: "Coca-Cola", unit: "can" },
    { name: "Fanta Orange 330ml", category: "Beverages", price: 0.80, cost: 0.45, stock: 100, min: 25, barcode: "5441234567002", brand: "Fanta", unit: "can" },
    { name: "Mango Juice 1L", category: "Beverages", price: 2.50, cost: 1.60, stock: 45, min: 10, barcode: "6901234567074", brand: "Almarai", unit: "carton" },
    { name: "Energy Drink 250ml", category: "Beverages", price: 1.50, cost: 0.90, stock: 80, min: 20, barcode: "6901234567075", brand: "Red Bull", unit: "can" },

    // Bread & Bakery
    { name: "White Bread Loaf", category: "Bread & Bakery", price: 1.00, cost: 0.50, stock: 50, min: 15, barcode: "6901234567080", brand: "Fresh", unit: "loaf" },
    { name: "Flatbread (Sabaad)", category: "Bread & Bakery", price: 0.50, cost: 0.20, stock: 80, min: 20, barcode: "6901234567081", brand: "Fresh", unit: "piece" },
    { name: "Digestive Biscuits 200g", category: "Bread & Bakery", price: 1.50, cost: 0.90, stock: 60, min: 15, barcode: "6901234567082", brand: "McVitie's", unit: "pack" },
    { name: "Cereals 375g", category: "Bread & Bakery", price: 4.00, cost: 2.80, stock: 30, min: 8, barcode: "6901234567083", brand: "Nestle", unit: "box" },

    // Cleaning Supplies
    { name: "Laundry Detergent 1kg", category: "Cleaning Supplies", price: 3.50, cost: 2.20, stock: 80, min: 20, barcode: "6901234567090", brand: "Omo", unit: "pack" },
    { name: "Dish Soap 500ml", category: "Cleaning Supplies", price: 1.50, cost: 0.85, stock: 90, min: 20, barcode: "6901234567091", brand: "Dawn", unit: "bottle" },
    { name: "Bleach 1L", category: "Cleaning Supplies", price: 1.20, cost: 0.65, stock: 60, min: 15, barcode: "6901234567092", brand: "Jif", unit: "bottle" },
    { name: "Trash Bags (30)", category: "Cleaning Supplies", price: 2.00, cost: 1.10, stock: 50, min: 12, barcode: "6901234567093", brand: "Local", unit: "roll" },
    { name: "Sponges (3 pack)", category: "Cleaning Supplies", price: 1.00, cost: 0.50, stock: 70, min: 15, barcode: "6901234567094", brand: "Local", unit: "pack" },

    // Personal Care
    { name: "Shampoo 400ml", category: "Personal Care", price: 3.50, cost: 2.30, stock: 45, min: 10, barcode: "6901234567100", brand: "Head & Shoulders", unit: "bottle" },
    { name: "Body Soap 100g", category: "Personal Care", price: 1.00, cost: 0.50, stock: 120, min: 30, barcode: "6901234567101", brand: "Lifebuoy", unit: "bar" },
    { name: "Toothpaste 100ml", category: "Personal Care", price: 2.00, cost: 1.20, stock: 70, min: 15, barcode: "6901234567102", brand: "Colgate", unit: "tube" },
    { name: "Toothbrush", category: "Personal Care", price: 1.20, cost: 0.60, stock: 80, min: 20, barcode: "6901234567103", brand: "Oral-B", unit: "piece" },
    { name: "Deodorant 50ml", category: "Personal Care", price: 2.80, cost: 1.80, stock: 35, min: 8, barcode: "6901234567104", brand: "Rexona", unit: "stick" },

    // Baby Products
    { name: "Diapers Medium (30)", category: "Baby Products", price: 8.50, cost: 5.80, stock: 40, min: 10, barcode: "6901234567110", brand: "Pampers", unit: "pack" },
    { name: "Diapers Large (26)", category: "Baby Products", price: 9.00, cost: 6.20, stock: 35, min: 8, barcode: "6901234567111", brand: "Pampers", unit: "pack" },
    { name: "Baby Formula 400g", category: "Baby Products", price: 7.50, cost: 5.00, stock: 25, min: 5, barcode: "6901234567112", brand: "Nestle", unit: "tin" },
    { name: "Baby Wipes (80)", category: "Baby Products", price: 2.00, cost: 1.20, stock: 55, min: 12, barcode: "6901234567113", brand: "Pampers", unit: "pack" },
  ]

  const products: Array<{ id: string; name: string; price: number; cost: number; stock: number; category: string; barcode: string }> = []
  for (const p of productData) {
    const created = await prisma.product.create({
      data: {
        name: p.name,
        barcode: p.barcode,
        sellingPrice: p.price,
        costPrice: p.cost,
        stockQuantity: p.stock,
        minimumStock: p.min,
        unit: p.unit,
        brand: p.brand,
        isActive: true,
        storeId: store.id,
        categoryId: categories[p.category],
      },
    })
    products.push({ id: created.id, name: p.name, price: p.price, cost: p.cost, stock: p.stock, category: p.category, barcode: p.barcode })
    console.log(`  + ${p.name} — $${p.price} (stock: ${p.stock})`)
  }
  console.log(`  Total: ${products.length} products\n`)

  // ─────────────────────────────────────────────
  // 4. SUPPLIERS
  // ─────────────────────────────────────────────
  console.log("4. Creating suppliers...")
  const supplierData = [
    { name: "Hormuud Trading Co.", phone: "+252 61 222 1001", email: "info@hormuudtrading.so", address: "Karaan District, Mogadishu" },
    { name: "Somali Wholesalers Ltd", phone: "+252 61 222 1002", email: "orders@somaliwholesale.so", address: "Bondhere District, Mogadishu" },
    { name: "Banaadir Food Importers", phone: "+252 61 222 1003", email: "sales@banaadirfood.so", address: "Hamar Jajab, Mogadishu" },
    { name: "East Africa Distributors", phone: "+252 61 222 1004", email: "supply@eadist.so", address: "Wadajir District, Mogadishu" },
  ]

  const suppliers: Array<{ id: string; name: string }> = []
  for (const s of supplierData) {
    const created = await prisma.supplier.create({
      data: { ...s, storeId: store.id },
    })
    suppliers.push({ id: created.id, name: s.name })
    console.log(`  + ${s.name}`)
  }
  console.log()

  // ─────────────────────────────────────────────
  // 5. CUSTOMERS
  // ─────────────────────────────────────────────
  console.log("5. Creating customers...")
  const customerData = [
    { firstName: "Ahmed", lastName: "Hassan", phone: "+252 61 333 1001", creditLimit: 500, address: "Hamar Weyne District" },
    { firstName: "Fatima", lastName: "Ali", phone: "+252 61 333 1002", creditLimit: 300, address: "Shangani District" },
    { firstName: "Omar", lastName: "Mohamed", phone: "+252 61 333 1003", creditLimit: 1000, address: "Abdi Aziz District" },
    { firstName: "Amina", lastName: "Ibrahim", phone: "+252 61 333 1004", creditLimit: 200, address: "Wardhigley District" },
    { firstName: "Hassan", lastName: "Abdi", phone: "+252 61 333 1005", creditLimit: 750, address: "Karaan District" },
    { firstName: "Khadija", lastName: "Warsame", phone: "+252 61 333 1006", creditLimit: 400, address: "Hamar Jajab District" },
    { firstName: "Abdullahi", lastName: "Noor", phone: "+252 61 333 1007", creditLimit: 600, address: "Bondhere District" },
    { firstName: "Sahra", lastName: "Yusuf", phone: "+252 61 333 1008", creditLimit: 250, address: "Wadajir District" },
    { firstName: "Ismail", lastName: "Farah", phone: "+252 61 333 1009", creditLimit: 800, address: "Yaqshid District" },
    { firstName: "Maryam", lastName: "Said", phone: "+252 61 333 1010", creditLimit: 350, address: "Daynile District" },
    { firstName: "Liban", lastName: "Ahmed", phone: "+252 61 333 1011", creditLimit: 0, address: "Mogadishu Center" },
    { firstName: "Zahra", lastName: "Hussein", phone: "+252 61 333 1012", creditLimit: 0, address: "Suq Bacad District" },
  ]

  const customers: Array<{ id: string; firstName: string; lastName: string; phone: string; creditLimit: number }> = []
  for (let i = 0; i < customerData.length; i++) {
    const c = customerData[i]
    const created = await prisma.customer.create({
      data: {
        ...c,
        customerCode: `CUST-${String(i + 1).padStart(6, "0")}`,
        isActive: true,
        storeId: store.id,
      },
    })
    customers.push({ id: created.id, ...c })
    console.log(`  + ${c.firstName} ${c.lastName} — ${c.phone} (credit: $${c.creditLimit})`)
  }
  console.log()

  // ─────────────────────────────────────────────
  // 6. PURCHASES (Stock replenishment history)
  // ─────────────────────────────────────────────
  console.log("6. Creating purchase history...")
  const purchaseHistory = [
    { invoice: "INV-2026-001", supplierIdx: 0, daysAgo: 25, status: "COMPLETED" as const, items: [
      { prodIdx: 0, qty: 50, cost: 9.00 }, { prodIdx: 1, qty: 100, cost: 2.10 }, { prodIdx: 4, qty: 60, cost: 1.80 },
      { prodIdx: 9, qty: 30, cost: 6.20 }, { prodIdx: 12, qty: 40, cost: 3.80 },
    ]},
    { invoice: "INV-2026-002", supplierIdx: 1, daysAgo: 20, status: "COMPLETED" as const, items: [
      { prodIdx: 2, qty: 80, cost: 0.90 }, { prodIdx: 3, qty: 80, cost: 0.90 }, { prodIdx: 21, qty: 60, cost: 1.10 },
      { prodIdx: 25, qty: 100, cost: 0.35 }, { prodIdx: 35, qty: 40, cost: 0.20 },
    ]},
    { invoice: "INV-2026-003", supplierIdx: 2, daysAgo: 15, status: "COMPLETED" as const, items: [
      { prodIdx: 20, qty: 60, cost: 1.10 }, { prodIdx: 22, qty: 40, cost: 0.85 }, { prodIdx: 23, qty: 50, cost: 0.75 },
      { prodIdx: 24, qty: 80, cost: 0.55 }, { prodIdx: 15, qty: 30, cost: 1.10 },
    ]},
    { invoice: "INV-2026-004", supplierIdx: 3, daysAgo: 10, status: "COMPLETED" as const, items: [
      { prodIdx: 30, qty: 60, cost: 5.50 }, { prodIdx: 31, qty: 30, cost: 0.45 }, { prodIdx: 32, qty: 30, cost: 0.45 },
      { prodIdx: 33, qty: 20, cost: 1.60 }, { prodIdx: 36, qty: 30, cost: 0.50 },
    ]},
    { invoice: "INV-2026-005", supplierIdx: 0, daysAgo: 5, status: "COMPLETED" as const, items: [
      { prodIdx: 38, qty: 30, cost: 2.20 }, { prodIdx: 39, qty: 40, cost: 0.85 }, { prodIdx: 40, qty: 30, cost: 0.65 },
      { prodIdx: 44, qty: 25, cost: 2.30 }, { prodIdx: 45, qty: 50, cost: 0.50 },
    ]},
  ]

  for (const p of purchaseHistory) {
    const purchaseDate = randomDate(p.daysAgo)
      const purchaseTotal = p.items.reduce((sum, item) => sum + item.qty * item.cost, 0)
      await prisma.purchase.create({
        data: {
          invoiceNumber: p.invoice,
          supplierName: suppliers[p.supplierIdx].name,
          supplierId: suppliers[p.supplierIdx].id,
          total: purchaseTotal,
          status: p.status,
          notes: "Regular stock replenishment",
          storeId: store.id,
          createdAt: purchaseDate,
        items: {
          create: p.items.map((item) => ({
            productId: products[item.prodIdx].id,
            productName: products[item.prodIdx].name,
            quantity: item.qty,
            costPrice: item.cost,
            unitName: "pcs",
            unitConversionFactor: 1,
          })),
        },
      },
    })
    console.log(`  + ${p.invoice} — ${suppliers[p.supplierIdx].name} (${p.items.length} items)`)
  }
  console.log()

  // ─────────────────────────────────────────────
  // 7. SALES (Realistic mix over past 30 days)
  // ─────────────────────────────────────────────
  console.log("7. Creating sales history...")

  const paymentMethods = ["CASH", "CASH", "CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CASH", "CASH", "CREDIT", "CREDIT"] as const
  const salesCreated: Array<{ id: string; total: number; amountPaid: number; paymentMethod: string; customerId: string | null }> = []

  for (let day = 29; day >= 0; day--) {
    const salesPerDay = day === 0 ? 5 : Math.floor(Math.random() * 4) + 2

    for (let s = 0; s < salesPerDay; s++) {
      const payMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as string
      const useCustomer = payMethod === "CREDIT" || (payMethod !== "CREDIT" && Math.random() > 0.6)
      const customer = useCustomer ? customers[Math.floor(Math.random() * customers.length)] : null

      const itemCount = Math.floor(Math.random() * 5) + 1
      const selectedProducts = new Set<number>()
      const items: Array<{ prodIdx: number; qty: number; unitPrice: number; discount: number }> = []

      while (items.length < itemCount && selectedProducts.size < products.length) {
        const idx = Math.floor(Math.random() * products.length)
        if (selectedProducts.has(idx)) continue
        selectedProducts.add(idx)
        const qty = Math.floor(Math.random() * 3) + 1
        const discount = Math.random() > 0.8 ? Math.round(qty * products[idx].price * 0.1 * 100) / 100 : 0
        items.push({ prodIdx: idx, qty, unitPrice: products[idx].price, discount })
      }

      const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
      const itemDiscount = items.reduce((sum, item) => sum + item.discount, 0)
      const saleDiscount = Math.random() > 0.9 ? randomAmount(0.5, 3.0) : 0
      const tax = 0
      const total = Math.max(0, subtotal - itemDiscount - saleDiscount + tax)
      const amountPaid = payMethod === "CREDIT" ? (Math.random() > 0.5 ? randomAmount(total * 0.3, total) : 0) : total
      const changeGiven = payMethod === "CASH" ? Math.max(0, amountPaid - total) : 0

      const saleDate = randomDate(day)
      const saleNumber = `SALE-000000` // Will be auto-generated

      try {
        const sale = await prisma.$transaction(async (tx) => {
          const createdSale = await tx.sale.create({
            data: {
              saleNumber: `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              subtotal,
              discount: saleDiscount,
              tax,
              total,
              amountPaid,
              changeGiven,
              paymentMethod: payMethod,
              status: "COMPLETED",
              storeId: store.id,
              customerId: customer?.id || null,
              cashierId: user.id,
              remainingBalance: payMethod === "CREDIT" ? Math.max(0, total - amountPaid) : null,
              creditStatus: payMethod === "CREDIT" ? (amountPaid >= total ? "PAID" : "UNPAID") : null,
              createdAt: saleDate,
              items: {
                create: items.map((item) => ({
                  productId: products[item.prodIdx].id,
                  productName: products[item.prodIdx].name,
                  barcode: products[item.prodIdx].barcode,
                  quantity: item.qty,
                  unitPrice: item.unitPrice,
                  costPrice: products[item.prodIdx].cost,
                  discount: item.discount,
                  total: item.unitPrice * item.qty - item.discount,
                  unitConversionFactor: 1,
                  unitName: "pcs",
                })),
              },
            },
          })

          for (const item of items) {
            const product = await tx.product.findUnique({
              where: { id: products[item.prodIdx].id },
              select: { stockQuantity: true },
            })
            if (!product || product.stockQuantity < item.qty) continue
            const previousStock = product.stockQuantity
            await tx.product.update({
              where: { id: products[item.prodIdx].id },
              data: { stockQuantity: { decrement: item.qty } },
            })
            await tx.inventoryTransaction.create({
              data: {
                transactionType: "OUT",
                quantity: item.qty,
                previousStock,
                newStock: previousStock - item.qty,
                reason: `Sale`,
                storeId: store.id,
                productId: products[item.prodIdx].id,
                createdBy: user.id,
                createdAt: saleDate,
              },
            })
          }

          if (payMethod === "CREDIT" && customer && amountPaid < total) {
            const remaining = total - amountPaid
            await tx.customer.update({
              where: { id: customer.id },
              data: {
                currentBalance: { increment: remaining },
                totalCreditSales: { increment: remaining },
              },
            })
          }

          return createdSale
        })

        salesCreated.push({
          id: sale.id,
          total,
          amountPaid,
          paymentMethod: payMethod,
          customerId: customer?.id || null,
        })

        if (s === 0 && day % 5 === 0) {
          process.stdout.write(`  Day -${day}: `)
        }
        process.stdout.write(".")
      } catch {
        // Skip if stock insufficient
      }
    }
    if (day % 5 === 0) console.log()
  }
  console.log(`\n  Total sales created: ${salesCreated.length}\n`)

  // Fix sale numbers
  console.log("  Renumbering sales...")
  const allSales = await prisma.sale.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "asc" },
  })
  for (let i = 0; i < allSales.length; i++) {
    await prisma.sale.update({
      where: { id: allSales[i].id },
      data: { saleNumber: `SALE-${String(i + 1).padStart(6, "0")}` },
    })
  }
  console.log(`  Renumbered ${allSales.length} sales.\n`)

  // ─────────────────────────────────────────────
  // 8. CREDIT PAYMENTS
  // ─────────────────────────────────────────────
  console.log("8. Creating credit payment history...")
  const creditSales = salesCreated.filter(
    (s) => s.paymentMethod === "CREDIT" && s.customerId && s.amountPaid < s.total
  )

  let paymentsMade = 0
  for (const sale of creditSales) {
    if (!sale.customerId) continue
    const customer = customers.find((c) => c.id === sale.customerId)
    if (!customer) continue

    const customerData = await prisma.customer.findUnique({ where: { id: customer.id } })
    if (!customerData || customerData.currentBalance <= 0) continue

    const payAmount = Math.min(
      randomAmount(5, customerData.currentBalance),
      customerData.currentBalance
    )
    if (payAmount <= 0) continue

    const payMethods = ["CASH", "ZAAD", "EVC_PLUS", "SAHAL"]
    const payMethod = payMethods[Math.floor(Math.random() * payMethods.length)]

    try {
      await prisma.$transaction(async (tx) => {
        await tx.customerPayment.create({
          data: {
            amount: payAmount,
            paymentMethod: payMethod,
            reference: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            notes: "Payment received",
            customerId: customer.id,
            cashierId: user.id,
            storeId: store.id,
            saleId: sale.id,
          },
        })

        const saleRecord = await tx.sale.findUnique({ where: { id: sale.id } })
        if (saleRecord) {
          const newRemaining = Math.max(0, saleRecord.remainingBalance! - payAmount)
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              amountPaid: { increment: payAmount },
              remainingBalance: newRemaining,
              creditStatus: newRemaining <= 0 ? "PAID" : "PARTIALLY_PAID",
            },
          })
        }

        await tx.customer.update({
          where: { id: customer.id },
          data: {
            currentBalance: { decrement: payAmount },
            totalPaid: { increment: payAmount },
            lastPaymentDate: new Date(),
          },
        })
      })
      paymentsMade++
    } catch {
      // Skip if balance already zero
    }
  }
  console.log(`  ${paymentsMade} credit payments recorded.\n`)

  // ─────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────
  console.log("=== SEED COMPLETE ===\n")

  const finalProductCount = await prisma.product.count({ where: { storeId: store.id } })
  const finalCustomerCount = await prisma.customer.count({ where: { storeId: store.id } })
  const finalSaleCount = await prisma.sale.count({ where: { storeId: store.id } })
  const finalSupplierCount = await prisma.supplier.count({ where: { storeId: store.id } })
  const totalRevenue = await prisma.sale.aggregate({
    where: { storeId: store.id, status: "COMPLETED" },
    _sum: { total: true },
  })
  const totalCollected = await prisma.sale.aggregate({
    where: { storeId: store.id, status: "COMPLETED" },
    _sum: { amountPaid: true },
  })
  const totalDebt = await prisma.customer.aggregate({
    where: { storeId: store.id, currentBalance: { gt: 0 } },
    _sum: { currentBalance: true },
    _count: true,
  })

  console.log(`Store:            Hassan Supermarket`)
  console.log(`Products:         ${finalProductCount}`)
  console.log(`Customers:        ${finalCustomerCount}`)
  console.log(`Sales:            ${finalSaleCount}`)
  console.log(`Suppliers:        ${finalSupplierCount}`)
  console.log(`Total Revenue:    $${(totalRevenue._sum.total || 0).toFixed(2)}`)
  console.log(`Total Collected:  $${(totalCollected._sum.amountPaid || 0).toFixed(2)}`)
  console.log(`Outstanding Debt: $${(totalDebt._sum.currentBalance || 0).toFixed(2)} (${totalDebt._count} customers)`)
  console.log()
  console.log(`Login: https://retailpos-sigma.vercel.app/en/login`)
  console.log(`POS:   https://retailpos-sigma.vercel.app/en/dashboard/sales/pos`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
