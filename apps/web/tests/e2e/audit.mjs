// Site-wide audit: crawls every reachable page in uk and en and checks status, console errors, horizontal overflow
// on four widths, and accessibility (axe: critical and serious). Usage: BASE=http://localhost:3199 node tests/e2e/audit.mjs
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3199";
const ADMIN = process.env.ADMIN_PASSWORD ?? "test123";
const CHROMIUM = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const WIDTHS = [320, 390, 768, 1280];
const AXE_WIDTHS = [390, 1280];
const IGNORED_CONSOLE = /favicon|Download the React DevTools|telegram\.org|Failed to load resource: net::ERR_FAILED/;

const problems = [];
const bad = (where, what) => { problems.push(`${where}: ${what}`); console.log(`FAIL  ${where}: ${what}`); };

const browser = await chromium.launch({ executablePath: CHROMIUM });
const origin = new URL(BASE).origin;

async function crawl(start, ctx) {
  const seen = new Set(), queue = [...start], pages = [];
  const page = await ctx.newPage();
  while (queue.length && seen.size < 400) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await page.goto(origin + url, { waitUntil: "domcontentloaded" }).catch((e) => { bad(url, `navigation failed: ${e.message}`); return null; });
    if (!res) continue;
    if (res.status() >= 400) { bad(url, `HTTP ${res.status()}`); continue; }
    pages.push(url);
    const links = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
    for (const h of links) {
      if (!h || h.startsWith("#") || /^(mailto:|tel:)/.test(h)) continue;
      let u; try { u = new URL(h, origin + url); } catch { continue; }
      if (u.origin !== origin) continue;
      if (/^\/(api|admin|app|p|media)\b/.test(u.pathname) || /\.(ics|csv)$/.test(u.pathname)) continue;
      if (!seen.has(u.pathname)) queue.push(u.pathname);
    }
  }
  await page.close();
  return pages;
}

// 1. public pages
const pub = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "uk-UA" });
const publicPages = await crawl(["/uk", "/en"], pub);
console.log(`crawled ${publicPages.length} public pages`);

// 2. admin pages (signed in) and the Mini App (signed test data)
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const ap = await adminCtx.newPage();
await ap.goto(BASE + "/admin/login");
await ap.getByLabel("Електронна пошта").fill("admin");
await ap.getByLabel("Пароль").fill(ADMIN);
await ap.getByRole("button", { name: "Увійти" }).click();
await ap.waitForURL((u) => !u.pathname.includes("login"));
const adminPages = ["/admin", "/admin/orders?tab=all", "/admin/catalog", "/admin/catalog/set-tea", "/admin/catalog/new", "/admin/pots", "/admin/owners", "/admin/questions", "/admin/journal", "/admin/care", "/admin/reviews", "/admin/analytics", "/admin/telegram"];

// check one page in one context: status, console, overflow, axe
async function check(ctx, url, { widths = WIDTHS, axeWidths = AXE_WIDTHS } = {}) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !IGNORED_CONSOLE.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    const res = await page.goto(origin + url, { waitUntil: "networkidle" }).catch(() => null);
    if (!res || res.status() >= 400) { bad(`${url} @${w}`, `HTTP ${res?.status()}`); continue; }
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (o.sw > o.cw + 1) bad(`${url} @${w}`, `horizontal overflow ${o.sw}>${o.cw}`);
    if (axeWidths.includes(w)) {
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      for (const v of r.violations.filter((x) => x.impact === "critical" || x.impact === "serious")) bad(`${url} @${w}`, `a11y ${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target?.join(" ")}`);
    }
  }
  for (const e of [...new Set(errors)]) bad(url, `console error: ${e.slice(0, 160)}`);
  await page.close();
}

for (const u of publicPages) await check(pub, u);
for (const u of ["/uk/checkout", "/uk/cart", "/uk/pot/unknown"]) await check(pub, u, { widths: [390, 1280] }).catch(() => {});
for (const u of adminPages) await check(adminCtx, u, { widths: [390, 1280] });

await browser.close();
console.log(problems.length ? `\n${problems.length} PROBLEMS` : "\nAUDIT CLEAN");
process.exit(problems.length ? 1 : 0);
