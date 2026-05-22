import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ 
    headless: true, 
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") console.log("  [CONSOLE ERR]", msg.text());
  });
  page.on("pageerror", err => console.log("  [PAGE ERR]", err.message));

  await page.goto("https://8d-reports.vercel.app", { timeout: 30000, waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  const html = await page.content();
  
  // Search for header and layout fragments
  console.log("=== HTML DIAGNOSTICS ===");
  console.log("Total HTML length:", html.length);
  console.log("Contains '<header':", html.includes("<header"));
  console.log("Contains 'sticky':", html.includes("sticky"));
  console.log("Contains '8D Reports':", (html.match(/8D Reports/g) || []).length, "times");
  console.log("Contains 'Sign in':", html.includes("Sign in"));
  console.log("Contains 'Feedback':", html.includes("Feedback"));
  
  // Check ALL body children
  const bodyChildren = await page.evaluate(() => {
    const result = [];
    for (const c of document.body.children) {
      result.push({
        tag: c.tagName,
        id: c.id || "-",
        className: (c.className || "").substring(0, 60),
        childCount: c.children.length,
        firstText: c.textContent?.substring(0, 60) || "-",
      });
    }
    return result;
  });
  console.log("\nBody children:");
  bodyChildren.forEach(c => console.log(`  ${c.tag}#${c.id} .${c.className} [${c.childCount}] "${c.firstText}"`));

  // Check Next.js root layout elements
  const rootElements = await page.evaluate(() => {
    const result = [];
    const all = document.body.querySelectorAll('header, nav, [class*="sticky"], [class*="flex"], button, a');
    const seen = new Set();
    for (const el of all) {
      const key = el.tagName + el.textContent?.substring(0, 30);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ tag: el.tagName, text: el.textContent?.substring(0, 40), class: (el.className||"").substring(0, 40) });
      if (result.length > 30) break;
    }
    return result;
  });
  console.log("\nTop-level elements:");
  rootElements.forEach(e => console.log(`  <${e.tag}> "${e.text}" [${e.class}]`));

  // Screenshot
  await page.screenshot({ path: "/Users/xiaoyouzi/Trae project/8D/scripts/homepage.png", fullPage: false });
  console.log("\nScreenshot saved to scripts/homepage.png");

  await browser.close();
}

main().catch(console.error);
