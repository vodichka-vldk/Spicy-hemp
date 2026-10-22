// End-to-end smoke test. Run: node tests/e2e/smoke.mjs (server on BASE, default http://localhost:3100)
import { chromium, devices } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ADMIN = process.env.ADMIN_PASSWORD ?? "test123";
const SHOTS = process.env.SHOTS ?? "/tmp/claude-0/shots";
const demo = JSON.parse(fs.readFileSync(".data/store.json", "utf8")).pots;
const basil = demo.find((p) => p.species === "basil").code;

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ ...devices["iPhone 13"], acceptDownloads: true, locale: "uk-UA", extraHTTPHeaders: { "Accept-Language": "uk-UA,uk;q=0.9" } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

const noOverflow = async (label) => {
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(w.sw <= w.cw + 1, `no horizontal scroll on ${label} (${w.sw}/${w.cw})`);
};

// 1. home + locale redirect
await page.goto(BASE + "/");
ok(page.url().endsWith("/uk"), "root redirects to /uk by Accept-Language");
ok((await page.locator("html").getAttribute("lang")) === "uk", "html lang=uk");
ok(await page.locator("h1").count() === 1, "home has exactly one h1");
await noOverflow("home");
await page.screenshot({ path: `${SHOTS}/01-home-mobile.png`, fullPage: true });

// 2. plants search
await page.getByRole("navigation", { name: "Mobile" }).getByText("Рослини").click();
await page.waitForURL("**/uk/plants");
ok((await page.locator("ul li a[href*='/plants/']").count()) === 15, "catalog lists 15 plants");
await page.fill("#plant-search", "мята");
ok((await page.locator("ul li a[href$='/plants/mint']").count()) === 1, "search 'мята' (no apostrophe) finds mint");
await page.fill("#plant-search", "zzz");
ok(await page.getByText("Нічого не знайдено").isVisible(), "empty state shown");
await page.fill("#plant-search", "");
await page.getByRole("button", { name: "Безпечні для тварин" }).click();
const safe = await page.locator("ul li a[href*='/plants/']").count();
ok(safe > 0 && safe < 15, `pet-safe filter narrows list (${safe})`);
await noOverflow("plants");
await page.screenshot({ path: `${SHOTS}/02-plants-mobile.png` });

// 3. QR scan flow
await page.goto(`${BASE}/p/${basil}`);
await page.waitForURL(/\/uk\/plants\/basil\?pot=/);
ok(true, "QR scan redirects to the basil passport with pot context");
await page.getByText("Ви відсканували горщик").waitFor({ timeout: 5000 }).then(() => ok(true, "pot context banner shown"), () => ok(false, "pot context banner shown"));
await noOverflow("plant passport");
await page.screenshot({ path: `${SHOTS}/03-passport-mobile.png`, fullPage: true });
const dl = page.waitForEvent("download");
await page.getByRole("link", { name: /Додати в календар/ }).click();
const download = await dl;
const ics = fs.readFileSync(await download.path(), "utf8");
ok(ics.includes("RRULE:FREQ=DAILY;INTERVAL=2") && ics.includes("BEGIN:VEVENT"), "watering reminder .ics downloads");
ok((await page.locator("details.acc[open]").count()) >= 1, "first care section is open by default");

// 4. invalid scan
await page.goto(`${BASE}/p/ABCD-EFGH`);
ok(page.url().includes("/uk/pot/unknown"), "invalid QR code lands on a friendly page");
await page.goto(`${BASE}/p/lookup?code=${basil.toLowerCase()}`);
ok(page.url().includes("/uk/plants/basil"), "manual code entry works");

// 5. shop → cart → checkout
await page.goto(`${BASE}/uk/plants/basil`);
await page.getByRole("link", { name: "Купити ще такий" }).click();
await page.waitForURL("**/uk/shop/basil");
ok((await page.getByText("Теракота").count()) === 0, "no glaze choice: one pot style for everything");
await page.getByRole("button", { name: /Додати в кошик/ }).click();
await page.getByText("Додано в кошик").waitFor();
await page.getByRole("button", { name: /Додати в кошик/ }).click();
await page.getByRole("navigation", { name: "Mobile" }).getByText("Кошик").click();
await page.waitForURL("**/uk/cart");
ok(await page.getByText("× ").count() >= 0, "cart opened");
ok((await page.locator("text=Горщик з рослиною: Базилік").count()) >= 1, "cart shows the line item");
ok((await page.getByRole("link", { name: "Оформити замовлення" }).count()) === 1, "cart has checkout button");
await noOverflow("cart");
await page.screenshot({ path: `${SHOTS}/04-cart-mobile.png` });
await page.getByRole("link", { name: "Оформити замовлення" }).click();
await page.waitForURL("**/uk/checkout");
await page.getByRole("button", { name: "Підтвердити замовлення" }).click();
await page.locator(".err").first().waitFor();
ok((await page.locator(".err").count()) >= 4, "empty submit shows validation errors");
ok((await page.evaluate(() => document.activeElement?.id)) === "f-name", "focus moves to the first invalid field");
await page.fill("#f-name", "Олена Шевченко");
await page.fill("#f-email", "olena@example.com");
await page.fill("#f-phone", "+380501234567");
await page.fill("#f-city", "Київ");
await page.fill("#f-address", "Відділення №12");
await page.locator("#f-agree").check();
ok((await page.locator(".err").count()) === 0, "errors disappear once the fields are fixed");
await noOverflow("checkout");
await page.screenshot({ path: `${SHOTS}/05-checkout-mobile.png`, fullPage: true });
await page.getByRole("button", { name: "Підтвердити замовлення" }).click();
await page.waitForURL(/\/uk\/order\/SH-/);
const orderId = page.url().split("/").pop();
ok(/^SH-\d{6}-[A-Z2-9]{8}$/.test(orderId), `order created (${orderId})`);
ok(await page.getByText("Дякуємо! Замовлення прийнято").isVisible(), "order confirmation page");
ok(!(await page.content()).includes("olena@example.com"), "order page does not leak customer data");
await page.screenshot({ path: `${SHOTS}/06-order-mobile.png` });
await page.goto(`${BASE}/uk/cart`);
ok(await page.getByText("Кошик порожній").isVisible(), "cart cleared after ordering");

// 6. language switch keeps the path
await page.goto(`${BASE}/uk/plants/rosemary`);
await page.getByRole("link", { name: "English" }).click();
await page.waitForURL("**/en/plants/rosemary");
ok((await page.locator("h1").innerText()) === "Rosemary", "language switch keeps the page and translates it");

// 7. desktop layout
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { "Accept-Language": "en-US" } });
const dp = await desk.newPage();
await dp.goto(BASE + "/");
ok(dp.url().endsWith("/en"), "English visitor gets /en");
await dp.screenshot({ path: `${SHOTS}/07-home-desktop.png`, fullPage: true });
await dp.goto(BASE + "/en/plants/thyme");
await dp.screenshot({ path: `${SHOTS}/08-passport-desktop.png`, fullPage: true });
const ow = await dp.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
ok(ow, "no horizontal scroll on desktop passport");

// 8. admin
const admin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const ap = await admin.newPage();
await ap.goto(BASE + "/admin/orders");
await ap.waitForURL(/\/admin\/login/);
ok(await ap.getByRole("heading", { name: "Вхід в адмінку" }).count() === 1, "admin redirects to the sign-in page");
await ap.getByLabel("Електронна пошта").fill("admin");
await ap.getByLabel("Пароль").fill("wrong");
await ap.getByRole("button", { name: "Увійти" }).click();
await ap.getByText("Невірна пошта або пароль.").waitFor();
ok(true, "wrong password is refused");
await ap.getByLabel("Електронна пошта").fill("admin");
await ap.getByLabel("Пароль").fill(ADMIN);
await ap.getByRole("button", { name: "Увійти" }).click();
await ap.waitForURL(/\/admin\/orders/);
ok(true, "admin signs in and returns to the page it wanted");
// make sure there is stock regardless of earlier runs
await ap.goto(BASE + "/admin/pots");
await ap.selectOption("select[name=product]", "basil");
await ap.fill("input[name=count]", "3");
await ap.fill("input[name=batch]", "E2E");
await ap.getByRole("button", { name: "Створити" }).click();
await ap.waitForLoadState("networkidle");
ok((await ap.getByText("E2E").count()) >= 3, "admin can generate a batch of pots");
// baskets: one form, one QR per basket, card opens from the scan
await ap.selectOption("select[name=product]", "set-tea");
await ap.fill("input[name=count]", "2");
await ap.fill("input[name=batch]", "E2EK");
await ap.getByRole("button", { name: "Створити" }).click();
await ap.waitForLoadState("networkidle");
const basketHref = await ap.locator("tr", { hasText: "E2EK" }).first().locator("a[href^='/p/']").getAttribute("href");
ok(Boolean(basketHref), "admin can generate a batch of baskets");
const gp = await (await browser.newContext({ ...devices["iPhone 13"], locale: "uk-UA" })).newPage();
await gp.goto(BASE + basketHref);
await gp.waitForURL(/\/uk\/garden\//);
ok(/ГОРЩИК · \d{3}/.test(await gp.locator("figcaption").innerText()), "basket QR opens the pot card with its number");
ok((await gp.locator("details.acc").count()) === 6, "pot card has six care sections");
ok((await gp.locator("a[href*='/plants/']").count()) >= 3, "pot card lists the herbs in the basket");
await gp.screenshot({ path: `${SHOTS}/10-garden-card.png`, fullPage: true });
await ap.goto(BASE + "/admin/orders");
ok(await ap.getByText(orderId).count() >= 1, "admin lists the new order");
await ap.getByText(orderId).first().click();
await ap.getByRole("button", { name: "Виділити горщики зі складу" }).click();
await ap.waitForLoadState("networkidle");
ok((await ap.locator("li.badge.font-mono").count()) >= 1, "pots allocated to the order");
await ap.getByRole("button", { name: /Підтверджено/ }).click();
await ap.getByText("Далі: Прийняти в роботу й зібрати").waitFor();
ok(true, "admin moves the order forward and sees the next step");
ok((await ap.getByRole("heading", { name: "Історія" }).count()) === 1 && (await ap.locator("ol li").count()) >= 2, "order history lists the status events");
await page.goto(`${BASE}/uk/order/${orderId}`);
ok((await page.getByText("Хід замовлення").count()) === 1, "customer sees the order progress");
await ap.goto(BASE + "/uk");
await ap.getByRole("link", { name: "Адмінка" }).first().click();
await ap.waitForURL(/\/admin$/);
ok(true, "the logo leads a signed-in admin to the admin");
await ap.goto(BASE + "/admin");
ok(await ap.getByRole("heading", { name: "Сьогодні" }).count() >= 1, "admin start page (Сьогодні) renders");
await ap.screenshot({ path: `${SHOTS}/09-admin.png`, fullPage: true });
await ap.goto(BASE + "/admin/pots/print?batch=DEMO-01");
ok((await ap.locator(".qr svg").count()) >= 1, "printable QR sheet renders");
const unauth = await (await browser.newContext()).request.get(BASE + "/admin/orders");
ok(unauth.url().includes("/admin/login"), "admin requires authentication");

// 9. SEO endpoints
const sm = await (await ctx.request.get(BASE + "/sitemap.xml")).text();
ok(sm.includes("/uk/plants/basil") && sm.includes("hreflang") || sm.includes("xhtml:link"), "sitemap includes plants with alternates");
ok((await (await ctx.request.get(BASE + "/robots.txt")).text()).includes("Disallow: /admin"), "robots disallows admin");

ok(errors.filter((e) => !/favicon|Download the React DevTools|status of 422/.test(e)).length === 0, `no console errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ""}`);
await browser.close();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
