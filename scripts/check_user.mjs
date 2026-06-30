import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/retailpos?schema=public' } }
});

async function main() {
  const userId = "cmqxllwjb0000w1n0j34ptsqa";
  const storeId = "cmqxlnocg0002w1c4tzzgway5";

  const [
    products,
    categories,
    customers,
    suppliers,
    purchases,
    sales,
    inventory,
    backups
  ] = await Promise.all([
    prisma.product.count({ where: { storeId } }),
    prisma.category.count({ where: { storeId } }),
    prisma.customer.count({ where: { storeId } }),
    prisma.supplier.count({ where: { storeId } }),
    prisma.purchase.count({ where: { storeId } }),
    prisma.sale.count({ where: { storeId } }),
    prisma.inventoryTransaction.count({ where: { storeId } }),
    prisma.backup.count({ where: { storeId } })
  ]);

  console.log("Store:", storeId);
  console.log("Products:", products);
  console.log("Categories:", categories);
  console.log("Customers:", customers);
  console.log("Suppliers:", suppliers);
  console.log("Purchases:", purchases);
  console.log("Sales:", sales);
  console.log("Inventory transactions:", inventory);
  console.log("Backups:", backups);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
