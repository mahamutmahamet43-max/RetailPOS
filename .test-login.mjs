import fetch from "node-fetch";

async function main() {
  const email = "test" + Date.now() + "@retailpos.com";

  // Register
  const regRes = await fetch("https://retailpos-sigma.vercel.app/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Owner", email, password: "Test123456!" }),
  });
  const regData = await regRes.json();
  console.log("Register:", regRes.status, regData.user?.email);

  // Get CSRF cookie+token from login page to establish session
  const loginPageRes = await fetch("https://retailpos-sigma.vercel.app/en/login");
  const loginCookies = loginPageRes.headers.raw()["set-cookie"] || [];
  const loginPageHtml = await loginPageRes.text();
  const m = loginPageHtml.match(/name="csrfToken".*?value="([^"]+)"/);
  const csrfFromPage = m ? m[1] : null;
  console.log("CSRF from page:", csrfFromPage?.substring(0, 20));

  // Also get from API
  const csrfRes = await fetch("https://retailpos-sigma.vercel.app/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const csrfCookies = csrfRes.headers.raw()["set-cookie"] || [];
  console.log("CSRF token:", csrfToken?.substring(0, 20));

  // Combine cookies
  const allCookies = [...loginCookies, ...csrfCookies].join("; ");
  console.log("Combined cookies (first 200):", allCookies.substring(0, 200));

  // Login with all cookies
  const loginRes = await fetch("https://retailpos-sigma.vercel.app/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: allCookies || csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken: csrfToken,
      email: email,
      password: "Test123456!",
      callbackUrl: "/en/dashboard",
    }),
    redirect: "manual",
  });

  console.log("Login status:", loginRes.status, "Location:", loginRes.headers.get("location"));

  const respCookies = loginRes.headers.raw()["set-cookie"] || [];
  console.log("Response cookies:", respCookies.length);
  respCookies.forEach((c, i) => console.log(`  Cookie ${i}: ${c.substring(0, 100)}`));

  const sessionCookie = respCookies.find((c) => c.includes("session-token"));
  if (sessionCookie) {
    console.log("\nSession cookie found!");
    const sessionRes = await fetch("https://retailpos-sigma.vercel.app/api/auth/session", {
      headers: { Cookie: sessionCookie.split(";")[0] },
    });
    const sessionData = await sessionRes.json();
    console.log("Session:", JSON.stringify(sessionData, null, 2));
  }
}

main().catch((e) => console.error(e));
