// Usage: node scripts/shot.mjs <url> <out.png> [width] [fullPage=1]
import { chromium } from "@playwright/test";
const [url, out, width = "1280", full = "1"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: full === "1" });
await browser.close();
console.log("saved", out);
