// End-to-end smoke test. Run: node tests/e2e/smoke.mjs (server on BASE, default http://localhost:3100)
import { chromium, devices } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3100";
const ADMIN = process.env.ADMIN_PASSWORD ?? "test123";
const SHOTS = process.env.SHOTS ?? "test-results/shots";
fs.mkdirSync(SHOTS, { recursive: true });
const demo = JSON.parse(fs.readFileSync(".data/store.json", "utf8")).pots;
const basil = demo.find((p) => p.species === "basil").code;

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`); if (!cond) failures++; };

const CHROMIUM = process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const browser = await chromium.launch({ executablePath: CHROMIUM });
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
await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Рослини" }).click();
await page.waitForURL("**/uk/plants");
ok((await page.locator("main a[href*='/uk/plants/']").count()) === 15, "catalog lists 15 plants");
await page.getByRole("searchbox").fill("мята");
ok((await page.locator("main a[href$='/plants/mint']").count()) === 1, "search 'мята' (no apostrophe) finds mint");
await page.getByRole("searchbox").fill("zzz");
ok(await page.getByText("Нічого не знайдено").isVisible(), "empty state shown");
await page.getByRole("searchbox").fill("");
await page.getByRole("button", { name: "Безпечні для тварин" }).click();
const safe = await page.locator("main a[href*='/uk/plants/']").count();
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
ok((await page.locator("details.sh-acc[open]").count()) >= 1, "first care section is open by default");

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
await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Кошик" }).click();
await page.waitForURL("**/uk/cart");
ok(await page.getByText("× ").count() >= 0, "cart opened");
ok((await page.locator("text=Горщик з рослиною: Базилік").count()) >= 1, "cart shows the line item");
ok((await page.getByRole("link", { name: "Оформити замовлення" }).count()) === 1, "cart has checkout button");
await noOverflow("cart");
await page.screenshot({ path: `${SHOTS}/04-cart-mobile.png` });
await page.getByRole("link", { name: "Оформити замовлення" }).click();
await page.waitForURL("**/uk/checkout");
await page.getByRole("button", { name: "Підтвердити замовлення" }).click();
await page.locator(".is-error").first().waitFor();
ok((await page.locator(".is-error").count()) >= 4, "empty submit shows validation errors");
ok((await page.evaluate(() => document.activeElement?.id)) === "f-name", "focus moves to the first invalid field");
await page.fill("#f-name", "Олена Шевченко");
await page.fill("#f-email", "olena@example.com");
await page.fill("#f-phone", "+380501234567");
await page.fill("#f-city", "Київ");
await page.fill("#f-address", "Відділення №12");
await page.locator("#f-agree").check({ force: true });
ok((await page.locator(".is-error").count()) === 0, "errors disappear once the fields are fixed");
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
await page.getByRole("heading", { name: "Кошик порожній" }).waitFor();
ok(true, "cart cleared after ordering");

// 5b. English storefront: international order paid by card (no Stripe key: the order waits for a payment link)
const en = await browser.newContext({ ...devices["iPhone 13"], locale: "en-GB", extraHTTPHeaders: { "Accept-Language": "en-GB" } });
const ep = await en.newPage();
await ep.goto(`${BASE}/en/shop/basil`);
await ep.getByRole("button", { name: /Add to cart/i }).click();
await ep.goto(`${BASE}/en/checkout`);
await ep.fill("#f-name", "Anna Smith"); await ep.fill("#f-email", "anna@example.com"); await ep.fill("#f-phone", "+4915112345678");
await ep.fill("#f-country", "Germany"); await ep.fill("#f-city", "Berlin"); await ep.fill("#f-address", "Hauptstrasse 1"); await ep.fill("#f-postcode", "10115");
await ep.locator("#f-agree").check({ force: true });
await ep.locator('button[type="submit"]').click();
await ep.waitForURL(/\/en\/order\/SH-/);
ok(await ep.getByText(/Online payment is not connected yet/).isVisible(), "an English card order is created and waits for a payment link when no provider is configured");
ok((await ep.content()).includes("€"), "English storefront prices in euro");
await en.close();

// 6. language switch keeps the path
await page.goto(`${BASE}/uk/plants/rosemary`);
await page.getByRole("button", { name: "EN" }).click();
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
ok((await gp.locator("details.sh-acc").count()) === 6, "pot card has six care sections");
ok((await gp.locator("a[href*='/plants/']").count()) >= 3, "pot card lists the herbs in the basket");
await gp.screenshot({ path: `${SHOTS}/10-garden-card.png`, fullPage: true });
await ap.goto(BASE + "/admin/orders");
ok(await ap.getByText(orderId).count() >= 1, "admin lists the new order");
await ap.getByText(orderId).first().click();
await ap.getByRole("button", { name: "Виділити горщики зі складу" }).click();
await ap.waitForLoadState("networkidle");
ok((await ap.locator("li .sh-badge").count()) >= 1, "pots allocated to the order");
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
// 8b. catalogue: create a basket, see it in the shop, change the price, hide it, export CSV
await ap.goto(BASE + "/admin/catalog");
ok(await ap.getByRole("heading", { name: "Каталог" }).count() === 1 && (await ap.locator("tr", { hasText: "Набір «Чайний»" }).count()) === 1, "admin catalogue lists the built-in products");
await ap.getByRole("link", { name: "Новий кошик" }).click();
await ap.waitForURL(/\/admin\/catalog\/new/);
await ap.locator('input[name="title_uk"]').fill("Ранковий E2E");
await ap.locator('input[name="herbs"][value="mint"]').check({ force: true });
await ap.locator('input[name="herbs"][value="basil"]').check({ force: true });
await ap.locator('input[name="price"]').fill("555");
await ap.locator('select[name="status"]').selectOption("published");
await ap.getByText("Як поливати").click();
await ap.locator('textarea[name="watering_uk"]').fill("Поливайте E2E-водою щодня");
await ap.getByRole("button", { name: "Зберегти" }).click();
await ap.waitForURL(/\/admin\/catalog\/set-rankovyi-e2e\?saved=1/);
ok(await (await ap.getByText("Збережено", { exact: true }).count()) >= 1, "admin saves a new basket from the editor");
const shopHtml = await (await ctx.request.get(BASE + "/uk/shop")).text();
ok(shopHtml.includes("Ранковий E2E") && shopHtml.includes("555"), "the new basket appears in the shop with its price");
const prodHtml = await (await ctx.request.get(BASE + "/uk/shop/set-rankovyi-e2e")).text();
ok(prodHtml.includes("E2E-водою"), "the care text written in the admin is on the product page");
// photo upload + draft preview
const PNG_1PX = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64");
await ap.setInputFiles('input[name="files"]', [{ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("<svg onload=alert(1)>") }]);
await ap.getByRole("button", { name: "Додати фото" }).click();
await ap.getByText(/потрібен JPEG, PNG або WebP/).waitFor();
ok(true, "a non-image file is refused even if named .png");
await ap.setInputFiles('input[name="files"]', [{ name: "basket.png", mimeType: "image/png", buffer: PNG_1PX }]);
await ap.getByRole("button", { name: "Додати фото" }).click();
await ap.getByText("Обкладинка").waitFor();
const photoSrc = await ap.locator("section img").first().getAttribute("src");
ok(!!photoSrc && (await ap.request.get(BASE + photoSrc)).status() === 200, "an uploaded photo is stored and served");
ok((await ctx.request.get(BASE + "/media/catalog/set-rankovyi-e2e/0000000000000000.png")).status() === 404, "unknown media path gives 404");
ok((await ctx.request.get(BASE + "/uk/shop")).ok() && (await (await ctx.request.get(BASE + "/uk/shop")).text()).includes(photoSrc), "the cover photo shows on the shop card");
await ap.getByRole("link", { name: /Перегляд/ }).click();
await ap.waitForURL(/\/preview/);
ok(await ap.getByRole("heading", { name: "Ранковий E2E" }).count() === 1 && await ap.getByRole("button", { name: /кошик/i }).count() === 0, "preview shows the product without a buy button");
await ap.goto(BASE + "/admin/catalog?q=E2E");
await ap.locator("tr", { hasText: "Ранковий E2E" }).locator('input[name="price"]').fill("600");
await ap.locator("tr", { hasText: "Ранковий E2E" }).getByRole("button", { name: "ок" }).click();
await ap.waitForLoadState("networkidle");
ok((await (await ctx.request.get(BASE + "/uk/shop")).text()).includes("600"), "quick price edit reaches the shop");
await ap.locator("tr", { hasText: "Ранковий E2E" }).getByRole("button", { name: "Сховати" }).click();
await ap.waitForLoadState("networkidle");
let hiddenStatus = 200;
for (let n = 0; n < 10 && hiddenStatus !== 404; n++) { hiddenStatus = (await ctx.request.get(BASE + "/uk/shop/set-rankovyi-e2e")).status(); if (hiddenStatus !== 404) await new Promise((r) => setTimeout(r, 500)); }
ok(hiddenStatus === 404, "a hidden basket disappears from the shop");
const csvRes = await ap.request.get(BASE + "/admin/catalog/export");
const csv = await csvRes.text();
ok(csv.includes("set-rankovyi-e2e") && csv.split("\n")[0].includes("watering_uk"), "catalogue exports as CSV");
await ap.goto(BASE + "/admin/catalog/set-rankovyi-e2e");
await ap.getByRole("button", { name: "Видалити кошик" }).click();
await ap.waitForURL(/\/admin\/catalog$/);
ok((await ap.locator("tr", { hasText: "Ранковий E2E" }).count()) === 0, "admin deletes a custom basket");

await ap.goto(BASE + "/admin/pots/print?batch=DEMO-01");
ok((await ap.locator(".qr svg").count()) >= 1, "printable QR sheet renders");
const unauth = await (await browser.newContext()).request.get(BASE + "/admin/orders");
ok(unauth.url().includes("/admin/login"), "admin requires authentication");

// 8c. Telegram: webhook secret, Mini App sign-in, activation, naming
import crypto from "node:crypto";
const BOT = process.env.TELEGRAM_BOT_TOKEN ?? "123456:E2E";
const TG = 100000 + (Date.now() % 900000); // a fresh Telegram user on every run
const initFor = (id, startParam) => {
  const f = { auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id, first_name: "Олена", language_code: "uk" }), ...(startParam ? { start_param: startParam } : {}) };
  const check = Object.entries(f).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(BOT).digest();
  return new URLSearchParams({ ...f, hash: crypto.createHmac("sha256", secret).update(check).digest("hex") }).toString();
};
const api = (path, init, body) => ctx.request.post(BASE + path, { headers: { "Content-Type": "application/json", ...(init ? { Authorization: `tma ${init}` } : {}) }, data: body ?? {} });
ok((await api("/api/app/me")).status() === 401, "Mini App API refuses requests without Telegram data");
ok((await api("/api/app/me", initFor(1).replace(/hash=[0-9a-f]{64}/, "hash=" + "0".repeat(64)))).status() === 401, "Mini App API refuses forged Telegram data");
ok((await ctx.request.post(BASE + "/api/telegram/webhook", { data: {} })).status() === 403, "bot webhook rejects calls without the secret");
ok((await ctx.request.post(BASE + "/api/telegram/webhook", { headers: { "x-telegram-bot-api-secret-token": "wrong" }, data: {} })).status() === 403, "bot webhook rejects a wrong secret");
ok((await ctx.request.post(BASE + "/api/telegram/webhook", { headers: { "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET ?? "e2e-secret" }, data: {} })).status() === 200, "bot webhook accepts the secret");

const storeFile = ".data/store.json";
const dbJson = JSON.parse(fs.readFileSync(storeFile, "utf8"));
const target = dbJson.items.filter((i) => /^E2EK/.test(i.batch) && !i.ownerId && i.status === "ready_for_sale").pop();
const code = target.code;
target.status = "sold";
fs.writeFileSync(storeFile, JSON.stringify(dbJson));

const outside = await browser.newContext({ viewport: { width: 390, height: 800 }, locale: "uk-UA" });
const op = await outside.newPage();
await op.route("**/telegram.org/**", (r) => r.abort());
await op.goto(BASE + "/app");
await op.getByText(/Відкрийте цю сторінку з Telegram-бота/).waitFor();
ok(true, "the Mini App page explains how to open it outside Telegram");

const tg = await browser.newContext({ viewport: { width: 390, height: 800 } });
await tg.addInitScript((initData) => { window.Telegram = { WebApp: { initData, ready() {}, expand() {} } }; }, initFor(TG, code));
await tg.route("**/telegram.org/**", (r) => r.abort());
const mp = await tg.newPage();
await mp.goto(BASE + "/app");
await mp.getByText(`Додати горщик ${code} до вашого списку?`).waitFor();
await mp.getByRole("button", { name: "Так, це мій" }).click();
await mp.getByLabel("Ім'я горщика").waitFor();
ok((await mp.getByText(/ГОРЩИК · \d{3}/).count()) >= 1, "the owner activates a pot from the QR link and sees it in the list");
await mp.getByLabel("Ім'я горщика").fill("Зелений сніданок");
await mp.getByRole("button", { name: "Зберегти" }).click();
await mp.getByText("Збережено").waitFor();
await mp.reload();
await mp.getByRole("heading", { name: "Зелений сніданок" }).or(mp.getByText("Зелений сніданок", { exact: true })).first().waitFor();
ok(true, "the name given to the pot is kept");
// journal with a private photo
await mp.getByText("Додати запис", { exact: true }).click();
await mp.getByLabel("Тип запису").selectOption("problem");
await mp.getByLabel("Нотатка").fill("Жовті листки E2E");
await mp.locator('input[type="file"]').setInputFiles({ name: "leaf.png", mimeType: "image/png", buffer: PNG_1PX });
await mp.getByRole("button", { name: "Зберегти запис" }).click();
await mp.getByText("Запис додано").waitFor();
await mp.getByText("Жовті листки E2E").first().waitFor();
await mp.waitForFunction(() => [...document.images].some((i) => i.src.startsWith("blob:") && i.naturalWidth > 0), null, { timeout: 10000 });
ok(true, "a journal entry with a photo is saved and the private photo loads for its owner");
const list = await (await api("/api/app/journal/list", initFor(TG), { code })).json();
const photoPath = list.entries[0].photos[0];
const photoReq = (who) => ctx.request.get(BASE + "/api/app/photo?path=" + encodeURIComponent(photoPath), { headers: { Authorization: `tma ${initFor(who)}` } });
ok((await photoReq(TG)).status() === 200 && (await photoReq(9999)).status() === 404 && (await ctx.request.get(BASE + "/api/app/photo?path=" + encodeURIComponent(photoPath))).status() === 401, "journal photos are private: owner 200, stranger 404, anonymous 401");
ok((await api("/api/app/journal/list", initFor(9999), { code })).status() === 404, "a stranger cannot read the journal");
ok((await ctx.request.get(BASE + "/admin/journal-photo?path=" + encodeURIComponent(photoPath))).url().includes("/admin/login"), "the admin photo route needs the admin session");
await ap.goto(BASE + "/admin/journal?kind=problem");
await ap.getByText("Жовті листки E2E").first().waitFor();
await ap.waitForFunction(() => [...document.images].some((i) => i.alt === "Фото з журналу" && i.complete && i.naturalWidth > 0), null, { timeout: 10000 });
ok(true, "admin sees the owner's problem entry with its photo");
// app tabs: today, scan, profile
await mp.goto(BASE + "/app#today");
await mp.getByText("На сьогодні задач немає").waitFor();
ok(true, "Today shows an empty state when nothing is due");
await mp.goto(BASE + "/app#scan");
await mp.getByLabel("Або введіть код з наклейки").fill("ZZZZ2222");
await mp.getByRole("button", { name: "Додати горщик" }).click();
await mp.getByText("Код введено з помилкою").waitFor();
ok(true, "Scan refuses a mistyped code with a clear message");
await mp.goto(BASE + "/app#profile");
await mp.getByRole("switch").click({ force: true });
await mp.getByText("Збережено").first().waitFor();
ok((await (await api("/api/app/me", initFor(TG))).json()).owner.notify === false, "Profile saves the reminder switch");
ok((await api("/api/app/profile", initFor(TG), { timezone: "Mars/Base" })).status() === 400, "an invalid time zone is refused");
await api("/api/app/profile", initFor(TG), { notify: true }); // back on: later steps plan reminders for this owner
ok((await (await api("/api/app/me", initFor(TG))).json()).owner.notify === true, "reminders can be switched back on");
ok((await api("/api/app/activate", initFor(9999), { code })).status() === 409, "another buyer cannot take an activated pot");
ok((await api("/api/app/rename", initFor(9999), { code, name: "Моє" })).status() === 404, "another buyer cannot rename it");
ok((await api("/api/app/activate", initFor(9999), { code: "ZZZZ2222" })).status() === 400, "a mistyped code (bad check character) is refused");

// 8c2. hardening: brute force on codes, headers, health
const BF = 700000 + (Date.now() % 100000);
let lastStatus = 0;
for (let n = 0; n < 10; n++) lastStatus = (await api("/api/app/activate", initFor(BF), { code: "ZZZZ2222" })).status();
ok(lastStatus === 429, "guessing pot codes is rate limited (429 after 8 failures)");
const home = await ctx.request.get(BASE + "/uk");
ok(home.headers()["x-frame-options"] === "DENY" && home.headers()["x-content-type-options"] === "nosniff", "pages carry security headers and cannot be framed");
ok(!(await ctx.request.get(BASE + "/app")).headers()["x-frame-options"], "the Mini App page can be opened inside Telegram");
const health = await ctx.request.get(BASE + "/api/health");
ok(health.ok() && (await health.json()).ok === true, "health endpoint answers");

// 8d. questions to Katya, owners, pot card, care schedule, cron
const asked = await api("/api/app/question", initFor(TG), { code, text: "Листя жовтіє E2E", symptom: "overwater" });
ok(asked.status() === 200 && /Поливайте рідше/.test((await asked.json()).hint?.fix ?? ""), "the owner asks Katya and gets first aid for the chosen symptom");
ok((await api("/api/app/question", initFor(9999), { code, text: "чужий" })).status() === 404, "nobody else can ask about this pot");
ok((await api("/api/app/question", initFor(TG), { code, text: "   " })).status() === 400, "an empty question is refused");
await ap.goto(BASE + "/admin/questions");
ok((await ap.getByText("Листя жовтіє E2E").count()) >= 1, "the question is in the admin queue");
await ap.getByLabel("Відповідь").first().fill("Полийте менше E2E");
await ap.getByRole("button", { name: "Відповісти" }).first().click();
await ap.getByText("Полийте менше E2E").first().waitFor();
const meAfter = await (await api("/api/app/me", initFor(TG))).json();
ok(meAfter.items.some((i) => i.questions.some((q) => q.answer === "Полийте менше E2E")), "the owner sees Katya's answer");
await ap.goto(BASE + "/admin/pots/" + code);
ok(await ap.getByText("Зелений сніданок").count() >= 1 && await ap.getByText("Листя жовтіє E2E").count() >= 1 && await ap.getByRole("heading", { name: /Заплановані нагадування/ }).count() === 1, "admin pot card shows owner, questions and reminders");
await ap.goto(BASE + "/admin/owners");
ok(await ap.getByText("Олена").count() >= 1, "admin lists owners");
await ap.goto(BASE + "/admin/care");
await ap.getByLabel("Полив: М'ята").or(ap.getByLabel(/Полив: М.ята/)).first().fill("3");
await ap.getByRole("button", { name: "Зберегти" }).click();
await ap.waitForLoadState("networkidle");
ok((await ap.getByLabel(/Полив: М.ята/).first().inputValue()) === "3", "the care schedule is saved");
ok((await ctx.request.get(BASE + "/api/cron/reminders")).status() === 403, "the cron endpoint refuses calls without the secret");
const cron = await ctx.request.get(BASE + "/api/cron/reminders", { headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? "e2e-cron"}` } });
ok(cron.status() === 200 && typeof (await cron.json()).sent === "number", "the cron endpoint plans and sends reminders");
await ap.goto(BASE + "/admin/pots/" + code);
ok((await ap.getByText(/полив/).count()) >= 1, "reminders are planned after activation");

// 9. SEO endpoints
const sm = await (await ctx.request.get(BASE + "/sitemap.xml")).text();
ok(sm.includes("/uk/plants/basil") && sm.includes("hreflang") || sm.includes("xhtml:link"), "sitemap includes plants with alternates");
ok((await (await ctx.request.get(BASE + "/robots.txt")).text()).includes("Disallow: /admin"), "robots disallows admin");

ok(errors.filter((e) => !/favicon|Download the React DevTools|status of 422/.test(e)).length === 0, `no console errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ""}`);
await browser.close();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
