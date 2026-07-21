import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  const ownerEmail = "admin@retailpos.com"
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  })

  if (existingOwner) {
    console.log("Seed data already exists, skipping...")
    return
  }

  const passwordHash = await bcrypt.hash("password123", 12)

  const owner = await prisma.user.create({
    data: {
      name: "Store Owner",
      email: ownerEmail,
      passwordHash,
      role: "OWNER",
    },
  })

  const store = await prisma.store.create({
    data: {
      name: "My Retail Store",
      slug: "my-retail-store",
      description: "A sample retail store",
      ownerId: owner.id,
    },
  })

  await prisma.user.update({
    where: { id: owner.id },
    data: { storeId: store.id },
  })

  await prisma.subscription.create({
    data: {
      plan: "FREE",
      status: "ACTIVE",
      startsAt: new Date(),
      storeId: store.id,
    },
  })

  await prisma.storeSetting.create({
    data: {
      storeId: store.id,
      address: "123 Main Street, City",
      phone: "+252 61 234 5678",
      email: ownerEmail,
      currency: "USD",
      timezone: "Africa/Mogadishu",
      dateFormat: "MM/DD/YYYY",
      lowStockAlert: true,
      salesNotification: true,
      emailNotification: true,
    },
  })

  const category = await prisma.category.create({
    data: {
      name: "General",
      description: "General products",
      color: "#3b82f6",
      isActive: true,
      storeId: store.id,
    },
  })

  await prisma.product.createMany({
    data: [
      {
        name: "Sample Product 1",
        barcode: "8901234567890",
        sellingPrice: 19.99,
        costPrice: 12.00,
        stockQuantity: 100,
        minimumStock: 10,
        unit: "pcs",
        isActive: true,
        storeId: store.id,
        categoryId: category.id,
      },
      {
        name: "Sample Product 2",
        barcode: "8901234567891",
        sellingPrice: 29.99,
        costPrice: 18.00,
        stockQuantity: 50,
        minimumStock: 5,
        unit: "pcs",
        isActive: true,
        storeId: store.id,
        categoryId: category.id,
      },
    ],
  })

  const managerPasswordHash = await bcrypt.hash("manager123", 12)
  await prisma.user.create({
    data: {
      name: "Store Manager",
      email: "manager@retailpos.com",
      passwordHash: managerPasswordHash,
      role: "MANAGER",
      storeId: store.id,
    },
  })

  const cashierPasswordHash = await bcrypt.hash("cashier123", 12)
  await prisma.user.create({
    data: {
      name: "Cashier User",
      email: "cashier@retailpos.com",
      passwordHash: cashierPasswordHash,
      role: "CASHIER",
      storeId: store.id,
    },
  })

  console.log("Seed complete!")
  console.log("  Owner:  admin@retailpos.com / password123")
  console.log("  Manager: manager@retailpos.com / manager123")
  console.log("  Cashier: cashier@retailpos.com / cashier123")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
