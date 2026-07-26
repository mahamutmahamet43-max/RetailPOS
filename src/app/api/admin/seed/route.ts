import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true, storeId: true } })
    if (!user || user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let store = user.storeId ? await prisma.store.findUnique({ where: { id: user.storeId } }) : null
    if (!store) store = await prisma.store.findFirst({ where: { ownerId: user.id } })
    if (!store) return NextResponse.json({ error: "No store" }, { status: 404 })

    const count = await prisma.product.count({ where: { storeId: store.id } })
    if (count > 0) return NextResponse.json({ status: "already_seeded", products: count })

    const result = await runSeed(store.id, user.id)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

async function runSeed(storeId: string, userId: string) {
  const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100
  const rDate = (d: number) => { const n = Date.now(); return new Date(n - d * 864e5 + Math.random() * 864e5) }

  await prisma.store.update({ where: { id: storeId }, data: { name: "Hassan Supermarket" } })
  await prisma.storeSetting.upsert({ where: { storeId }, create: { storeId, address: "Maka Al-Mukarama Road, Mogadishu, Somalia", phone: "+252 61 555 1234", currency: "USD", timezone: "Africa/Mogadishu", dateFormat: "DD/MM/YYYY", lowStockAlert: true, salesNotification: true, emailNotification: false }, update: { address: "Maka Al-Mukarama Road, Mogadishu", phone: "+252 61 555 1234", currency: "USD" } })

  const cats = ["Rice & Grains","Cooking Oils","Sugar & Sweeteners","Tea & Coffee","Canned Goods","Spices & Seasonings","Dairy & Eggs","Beverages","Bread & Bakery","Cleaning Supplies","Personal Care","Baby Products"]
  const catIds: Record<string, string> = {}
  for (const c of cats) { const r = await prisma.category.create({ data: { name: c, storeId, isActive: true } }); catIds[c] = r.id }

  const pd = [
    ["Basmati Rice 5kg","6901234567001",12.5,9,85,20,"bag","India Gate","Rice & Grains"],
    ["Basmati Rice 1kg","6901234567002",3,2,150,30,"bag","India Gate","Rice & Grains"],
    ["Pasta (Spaghetti) 500g","8001234567001",1.5,.8,200,40,"pack","Barilla","Rice & Grains"],
    ["Pasta (Macaroni) 500g","8001234567002",1.5,.8,180,40,"pack","Barilla","Rice & Grains"],
    ["All Purpose Flour 2kg","6901234567010",2.8,1.8,120,30,"bag","Xawaash","Rice & Grains"],
    ["Corn Flour 1kg","6901234567011",1.8,1,90,20,"pack","Afri","Rice & Grains"],
    ["Vermicelli 400g","6901234567012",1.6,.9,75,15,"pack","Xawaash","Rice & Grains"],
    ["Sunflower Oil 1L","6901234567020",3.5,2.2,100,25,"bottle","Afri","Cooking Oils"],
    ["Sunflower Oil 3L","6901234567021",9,6,45,10,"bottle","Afri","Cooking Oils"],
    ["Olive Oil 500ml","8001234567020",6.5,4.5,35,10,"bottle","Munda","Cooking Oils"],
    ["Palm Oil 1L","6901234567022",2.8,1.6,60,15,"bottle","Munda","Cooking Oils"],
    ["White Sugar 5kg","6901234567030",5.5,3.5,110,20,"bag","Kasuku","Sugar & Sweeteners"],
    ["White Sugar 1kg","6901234567031",1.5,.9,180,40,"bag","Kasuku","Sugar & Sweeteners"],
    ["Brown Sugar 1kg","6901234567032",1.8,1.1,50,10,"bag","Tropical","Sugar & Sweeteners"],
    ["Honey 500ml","6901234567033",8,5,25,5,"jar","Somali Natural","Sugar & Sweeteners"],
    ["Black Tea 250g","6901234567040",2.5,1.5,95,20,"pack","Kericho Gold","Tea & Coffee"],
    ["Green Tea 25 Bags","6901234567041",2,1.2,65,15,"box","Lipton","Tea & Coffee"],
    ["Nescafe Classic 100g","8001234567040",5.5,3.8,40,10,"jar","Nescafe","Tea & Coffee"],
    ["Turkish Coffee 250g","6901234567042",4,2.5,30,8,"pack","Mehmet Efendi","Tea & Coffee"],
    ["Cardamom Tea Mix 100g","6901234567043",3.5,2,45,10,"pack","Xawaash","Tea & Coffee"],
    ["Tuna in Oil 185g","6901234567050",1.8,1,150,30,"can","Fishco","Canned Goods"],
    ["Sardines in Tomato 155g","6901234567051",1.2,.6,120,25,"can","Fishco","Canned Goods"],
    ["Baked Beans 400g","6901234567052",1.5,.8,80,20,"can","Heinz","Canned Goods"],
    ["Chickpeas 400g","6901234567053",1.3,.7,90,20,"can","Africa's Best","Canned Goods"],
    ["Tomato Paste 200g","6901234567054",1,.4,200,40,"pack","Afri","Canned Goods"],
    ["Mixed Vegetables 400g","6901234567055",1.4,.8,60,15,"can","Africa's Best","Canned Goods"],
    ["Table Salt 1kg","6901234567060",.8,.3,200,40,"pack","Cerebos","Spices & Seasonings"],
    ["Black Pepper 100g","6901234567061",2.5,1.5,45,10,"pack","Tropical","Spices & Seasonings"],
    ["Cumin Powder 100g","6901234567062",2,1.2,40,10,"pack","Xawaash","Spices & Seasonings"],
    ["Curry Powder 100g","6901234567063",2.2,1.3,35,8,"pack","Tropical","Spices & Seasonings"],
    ["Bouillon Cubes (10)","6901234567064",1.2,.6,100,20,"box","Maggi","Spices & Seasonings"],
    ["Fresh Milk 1L","6901234567070",2,1.3,60,15,"carton","Hormuud","Dairy & Eggs"],
    ["Powdered Milk 400g","6901234567071",5.5,3.8,50,12,"tin","Nido","Dairy & Eggs"],
    ["Yogurt 500g","6901234567072",1.8,1,40,10,"cup","Hormuud","Dairy & Eggs"],
    ["Eggs (30 pack)","6901234567073",4.5,3,30,8,"tray","Local","Dairy & Eggs"],
    ["Butter 200g","6901234567074",3,2,25,6,"pack","Manda","Dairy & Eggs"],
    ["Water 1.5L","6901234567080",.5,.2,300,60,"bottle","Mogadishu Water","Beverages"],
    ["Water 500ml (24pk)","6901234567081",8,5.5,25,5,"pack","Mogadishu Water","Beverages"],
    ["Coca-Cola 330ml","6901234567082",.8,.4,120,25,"can","Coca-Cola","Beverages"],
    ["Fanta Orange 330ml","6901234567083",.8,.4,100,20,"can","Fanta","Beverages"],
    ["Mango Juice 1L","6901234567084",2.5,1.5,45,10,"carton","Pick N Peel","Beverages"],
    ["Energy Drink 250ml","6901234567085",1.5,.8,80,15,"can","Sting","Beverages"],
    ["White Bread Loaf","6901234567090",1,.5,50,15,"loaf","Sahan","Bread & Bakery"],
    ["Flatbread (Sabaad)","6901234567091",.5,.2,80,20,"piece","Local Bakery","Bread & Bakery"],
    ["Digestive Biscuits 200g","8001234567090",1.5,.8,60,12,"pack","McVitie's","Bread & Bakery"],
    ["Cereals 375g","6901234567092",4,2.5,30,8,"box","Kellogg's","Bread & Bakery"],
    ["Laundry Detergent 1kg","6901234567100",3.5,2,80,15,"pack","OMO","Cleaning Supplies"],
    ["Dish Soap 500ml","6901234567101",1.5,.7,90,20,"bottle","Sunlight","Cleaning Supplies"],
    ["Bleach 1L","6901234567102",1.2,.5,60,12,"bottle","Klin","Cleaning Supplies"],
    ["Trash Bags (30)","6901234567103",2,1,50,10,"pack","Glad","Cleaning Supplies"],
    ["Sponges (3 pack)","6901234567104",1,.4,70,15,"pack","Scotch-Brite","Cleaning Supplies"],
    ["Shampoo 400ml","6901234567110",3.5,2,45,10,"bottle","Head & Shoulders","Personal Care"],
    ["Body Soap 100g","6901234567111",1,.4,120,25,"bar","Dettol","Personal Care"],
    ["Toothpaste 100ml","6901234567112",2,1,70,15,"tube","Colgate","Personal Care"],
    ["Toothbrush","6901234567113",1.2,.5,80,20,"piece","Oral-B","Personal Care"],
    ["Deodorant 50ml","6901234567114",2.8,1.5,35,8,"piece","Nivea","Personal Care"],
    ["Diapers Medium (30)","6901234567120",8.5,5.5,40,10,"pack","Pampers","Baby Products"],
    ["Diapers Large (26)","6901234567121",9,6,35,8,"pack","Pampers","Baby Products"],
    ["Baby Formula 400g","6901234567122",7.5,5,25,6,"tin","NAN","Baby Products"],
    ["Baby Wipes (80)","6901234567123",2,1,55,12,"pack","Pampers","Baby Products"],
  ] as const

  const prods: { id: string; price: number; cost: number; stock: number }[] = []
  for (const p of pd) {
    const r = await prisma.product.create({ data: { name: p[0], barcode: p[1], sellingPrice: p[2], costPrice: p[3], stockQuantity: p[4], minimumStock: p[5], unit: p[6], brand: p[7], isActive: true, storeId, categoryId: catIds[p[8]] } })
    prods.push({ id: r.id, price: p[2], cost: p[3], stock: p[4] })
  }

  const supData = [["Hormuud Trading Co.","+252 61 222 1001","Industrial Road"],["Somali Wholesalers Ltd","+252 61 222 1002","Karaan District"],["Banaadir Food Importers","+252 61 222 1003","Hamar Weyne"],["East Africa Distributors","+252 61 222 1004","Bondhere"]] as const
  const sups: { id: string }[] = []
  for (const s of supData) { const r = await prisma.supplier.create({ data: { name: s[0], phone: s[1], address: s[2], isActive: true, storeId } }); sups.push({ id: r.id }) }

  const custData = [["Ahmed","Hassan","+252 61 333 1001",500],["Fatima","Ali","+252 61 333 1002",300],["Omar","Mohamed","+252 61 333 1003",1000],["Amina","Ibrahim","+252 61 333 1004",200],["Hassan","Abdi","+252 61 333 1005",750],["Khadija","Warsame","+252 61 333 1006",400],["Abdullahi","Noor","+252 61 333 1007",600],["Sahra","Yusuf","+252 61 333 1008",250],["Ismail","Farah","+252 61 333 1009",800],["Maryam","Said","+252 61 333 1010",350],["Liban","Ahmed","+252 61 333 1011",0],["Zahra","Hussein","+252 61 333 1012",0]] as const
  const custs: { id: string; cl: number }[] = []
  for (let i = 0; i < custData.length; i++) { const c = custData[i]; const r = await prisma.customer.create({ data: { firstName: c[0], lastName: c[1], phone: c[2], creditLimit: c[3], customerCode: `CUST-${String(i+1).padStart(6,"0")}`, isActive: true, storeId } }); custs.push({ id: r.id, cl: c[3] }) }

  const invData = [[0,"INV-2026-001",28,[[0,50,9],[1,100,2],[7,30,2.2],[20,80,1],[21,60,.6]]],[1,"INV-2026-002",21,[[2,100,.8],[3,80,.8],[15,40,1.5],[24,120,.4],[39,60,3.8]]],[2,"INV-2026-003",14,[[4,40,1.8],[8,15,6],[30,30,3.8],[31,25,1],[41,40,.5]]],[3,"INV-2026-004",7,[[36,80,.4],[37,60,.4],[44,40,.4],[45,50,1],[46,30,.5]]],[0,"INV-2026-005",3,[[4,40,1.8],[8,15,6],[48,20,5.5],[49,15,6],[50,10,5]]]] as const
  for (const inv of invData) {
    const items = inv[3] as readonly (readonly [number, number, number])[]
    const total = items.reduce((s, i) => s + i[1] * i[2], 0)
    await prisma.purchase.create({ data: { invoiceNumber: inv[1], supplierName: supData[inv[0]][0], supplierId: sups[inv[0]].id, total, status: "COMPLETED", notes: "Stock replenishment", storeId, createdAt: rDate(inv[2]), items: { create: items.map(i => ({ productId: prods[i[0]].id, productName: pd[i[0]][0], quantity: i[1], costPrice: i[2], unitName: "pcs", unitConversionFactor: 1 })) } } })
  }

  const methods = ["CASH","CASH","CASH","CASH","ZAAD","EVC_PLUS","SAHAL","CREDIT","CREDIT"]
  const sales: { id: string; total: number; method: string; custId: string | null; paid: number }[] = []
  let sc = 0

  for (let d = 30; d >= 0; d--) {
    const n = d === 0 ? 5 : 2 + Math.floor(Math.random() * 3)
    for (let s = 0; s < n; s++) {
      const m = methods[Math.floor(Math.random() * methods.length)]
      const useCust = m === "CREDIT" || Math.random() > 0.6
      const cust = useCust ? custs[Math.floor(Math.random() * custs.length)] : null
      const sel = new Set<number>(); const items: { pi: number; qty: number; up: number }[] = []
      while (items.length < 3 && sel.size < prods.length) { const pi = Math.floor(Math.random() * prods.length); if (sel.has(pi)) continue; sel.add(pi); const mx = Math.min(prods[pi].stock, 5); if (mx <= 0) continue; items.push({ pi, qty: 1 + Math.floor(Math.random() * mx), up: prods[pi].price }) }
      if (!items.length) continue
      let gt = 0, tc = 0
      for (const i of items) { gt += i.up * i.qty; tc += prods[i.pi].cost * i.qty }
      gt = Math.round(gt * 100) / 100; tc = Math.round(tc * 100) / 100
      const paid = m === "CREDIT" ? rnd(gt * 0.3, gt * 0.7) : gt
      sc++; const sn = `SALE-${String(sc).padStart(6, "0")}`
      const dt = rDate(d)
      const sale = await prisma.sale.create({ data: { saleNumber: sn, storeId, subtotal: gt, tax: 0, discount: 0, total: gt, amountPaid: paid, paymentMethod: m, status: "COMPLETED", customerId: cust?.id || null, customerName: cust ? `${pd[0][0]}` : null, createdBy: userId, createdAt: dt, saleNumberIndex: sc } })
      let stk = prods.map(p => p.stock)
      for (const i of items) { const ps = stk[i.pi]; const ns = Math.max(0, ps - i.qty); await prisma.saleItem.create({ data: { saleId: sale.id, productId: prods[i.pi].id, productName: pd[i.pi][0], quantity: i.qty, unitPrice: i.up, costPrice: prods[i.pi].cost, storeId } }); await prisma.inventoryTransaction.create({ data: { transactionType: "SALE", quantity: -i.qty, previousStock: ps, newStock: ns, reason: sn, reference: sale.id, storeId, productId: prods[i.pi].id, createdBy: userId, createdAt: dt } }); stk[i.pi] = ns; prods[i.pi].stock = ns }
      for (let i = 0; i < items.length; i++) await prisma.product.update({ where: { id: prods[items[i].pi].id }, data: { stockQuantity: stk[items[i].pi] } })
      if (cust && m === "CREDIT") await prisma.customer.update({ where: { id: cust.id }, data: { currentBalance: { increment: gt - paid } } })
      sales.push({ id: sale.id, total: gt, method: m, custId: cust?.id || null, paid })
    }
  }

  let cpc = 0
  for (const s of sales) { if (s.method === "CREDIT" && s.custId && Math.random() > 0.3) { await prisma.customerPayment.create({ data: { customerId: s.custId, storeId, amount: rnd(s.paid * 0.3, s.paid), paymentMethod: "CASH", saleId: s.id, reference: "Credit payment", createdAt: rDate(Math.floor(Math.random() * 20)) } }); cpc++ } }

  return { status: "seeded", storeName: "Hassan Supermarket", products: prods.length, categories: cats.length, customers: custs.length, suppliers: sups.length, sales: sc, creditPayments: cpc }
}
