import { chromium, devices } from "playwright";
const BASE = process.env.BASE ?? "http://localhost:3150";
const OUT = "/tmp/claude-0/shots";
const pages = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [name, path, mobile] of pages.map((a) => a.split("|"))) {
  const ctx = await b.newContext(mobile === "m" ? { ...devices["iPhone 13"], locale: "uk-UA" } : { viewport: { width: 1280, height: 900 }, locale: "uk-UA" });
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
