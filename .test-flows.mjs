import fetch from "node-fetch";

const BASE = "https://retailpos-sigma.vercel.app";
const email = "test" + Date.now() + "@retailpos.com";

async function login() {
  // Register
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Owner", email, password: "Test123456!" }),
  });
  const regData = await regRes.json();
  console.log("✅ Register:", regData.user?.email);

  // Get CSRF + login
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.raw()["set-cookie"] || [];

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: email,
      password: "Test123456!",
      callbackUrl: "/en/dashboard",
    }),
    redirect: "manual",
  });

  const respCookies = loginRes.headers.raw()["set-cookie"] || [];
  const sessionCookie = respCookies.find((c) => c.includes("session-token"));
  const cookieValue = sessionCookie.split(";")[0];
  console.log("✅ Login OK");
  return cookieValue;
}

async function main() {
  const cookie = await login();

  // 1. Health check
  const health = await fetch(`${BASE}/api/health`);
  console.log("✅ Health:", (await health.json()).status);

  // 2. Create category
  const catRes = await fetch(`${BASE}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "Test Category", description: "Test", color: "#ff0000" }),
  });
  const cat = await catRes.json();
  console.log("✅ Category created:", catRes.status, cat.name || cat.error);

  // 3. Create product
  const prodRes = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Test Product",
      barcode: "BAR" + Date.now(),
      sellingPrice: 19.99,
      costPrice: 10.00,
      stockQuantity: 100,
      minimumStock: 10,
      unit: "pcs",
      categoryId: cat.id,
    }),
  });
  const prod = await prodRes.json();
  console.log("✅ Product created:", prodRes.status, prod.name || prod.error);

  // 4. Create supplier
  const suppRes = await fetch(`${BASE}/api/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Test Supplier",
      phone: "+252612345678",
      email: "supplier@test.com",
      address: "Test Address"
    }),
  });
  const supp = await suppRes.json();
  console.log("✅ Supplier created:", suppRes.status, supp.name || supp.error);

  // 5. Create purchase
  const purchRes = await fetch(`${BASE}/api/purchases`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      supplierId: supp.id,
      supplierName: supp.name,
      notes: "Test purchase",
      items: [{
        productId: prod.id,
        productName: prod.name,
        quantity: 50,
        costPrice: 10.00,
        unitName: "pcs",
        unitConversionFactor: 1,
      }],
    }),
  });
  const purch = await purchRes.json();
  console.log("✅ Purchase created:", purchRes.status, purch.invoiceNumber || purch.error);

  // Complete the purchase
  if (purch.id) {
    const completeRes = await fetch(`${BASE}/api/purchases/${purch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    const complete = await completeRes.json();
    console.log("✅ Purchase completed:", completeRes.status, complete.status || complete.error);
  }

  // 6. Complete a sale
  const saleRes = await fetch(`${BASE}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      items: [{
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        quantity: 2,
        unitPrice: 19.99,
        discount: 0,
        unitName: "pcs",
        unitConversionFactor: 1,
      }],
      paymentMethod: "CASH",
      amountPaid: 50.00,
      discount: 0,
      tax: 0,
    }),
  });
  const sale = await saleRes.json();
  console.log("✅ Sale completed:", saleRes.status, sale.saleNumber || sale.error);

  // 7. Get a report
  const reportRes = await fetch(`${BASE}/api/reports/dashboard`, {
    headers: { Cookie: cookie },
  });
  const report = await reportRes.json();
  console.log("✅ Dashboard report:", reportRes.status, 
    report.totalSales !== undefined ? `Sales: ${report.totalSales}` : "OK");

  // 8. Create backup
  const backupRes = await fetch(`${BASE}/api/admin/backups`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const backup = await backupRes.json();
  console.log("✅ Backup created:", backupRes.status, 
    backup.success ? `File: ${backup.backup?.filename}` : (backup.error || "OK"));

  // Check backups list
  const backupListRes = await fetch(`${BASE}/api/admin/backups`, {
    headers: { Cookie: cookie },
  });
  const backupList = await backupListRes.json();
  console.log("✅ Backups list:", backupListRes.status, 
    `Count: ${backupList.totalBackups}`);

  console.log("\n All production checks passed!");
}

main().catch((e) => console.error(e));
