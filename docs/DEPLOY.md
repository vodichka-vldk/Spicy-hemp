# Розгортання на бойовий сервер

Нижче повний шлях від порожнього акаунта до працюючого сайту. Усе, що потребує ваших ключів, робите ви; ключі в чат не надсилайте, а додавайте змінними в налаштуваннях хостингу.

## 1. База даних (Supabase)
1. Створіть проєкт у Supabase (регіон поруч із клієнтами, наприклад Frankfurt).
2. SQL Editor: виконайте по черзі `supabase/migrations/0001_init.sql`, `0002_catalog_items_journal.sql`, `0003_catalog_photos.sql`.
3. Storage: бакети `journal` (приватний), `reviews` і `catalog` (публічні) створює міграція. Перевірте в розділі Storage.
4. Settings → API: скопіюйте `Project URL` і `service_role` ключ (він лише для сервера, ніколи в браузер).
5. Локально для перевірки: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run check:connections`, потім `npm run supabase:seed` (родини й види трав).

## 2. Хостинг (Vercel)
1. Імпортуйте репозиторій, **Root Directory = `apps/web`**, Framework Next.js.
2. Environment Variables (Production):

| Змінна | Що |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | https-адреса сайту, без слеша в кінці |
| `NEXT_PUBLIC_QR_BASE_URL` | необов'язково, коротший домен для QR |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | з кроку 1 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | вхід в адмінку; пароль довгий (16+ символів) |
| `ADMIN_SESSION_SECRET` | довгий випадковий рядок |
| `ANALYTICS_SALT` | довгий випадковий рядок |
| `CRON_SECRET` | довгий випадковий рядок; Vercel сам надсилає його планувальнику |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `NEXT_PUBLIC_TG_BOT` | див. `docs/TELEGRAM.md` |
| `NOVA_POSHTA_API_KEY`, `NP_SENDER_*` | див. `docs/INTEGRATIONS.md` |
| `STRIPE_*`, `LIQPAY_*` | коли підключите онлайн-оплату |
| `NOTION_TOKEN` | лише для `npm run sync:notion` (паспорти трав) |

3. Deploy. Перевірте `https://<сайт>/api/health`: має бути `{"ok":true,"store":"supabase"}`.
4. Планувальник нагадувань: `apps/web/vercel.json` вмикає щогодинний виклик `/api/cron/reminders`. На плані Hobby Vercel дозволяє лише раз на добу: тоді або перейдіть на Pro, або викликайте адресу будь-яким зовнішнім cron щогодини: `curl -H "Authorization: Bearer $CRON_SECRET" https://<сайт>/api/cron/reminders`.

## 3. Telegram
Адмінка → Telegram: «Підключити вебхук», «Створити код», надіслати боту `/start link_КОД`. У @BotFather вкажіть Mini App `https://<сайт>/app`. Деталі в `docs/TELEGRAM.md`.

## 4. Перший запуск вмісту
- Адмінка → Каталог: ціни, тексти, фото кошиків.
- Адмінка → Горщики й QR: створіть партію, роздрукуйте етикетки.
- Перевірте сценарій «замовлення → оплата → відправка → активація → нагадування» на тестовому замовленні.

## 5. Захист і експлуатація
- HTTPS обов'язковий (заголовок HSTS уже віддається). Додайте у файрволі хостингу ліміт на `/admin/login` і `/api/*`: вбудований ліміт працює в межах одного екземпляра.
- Моніторинг: будь-який uptime-сервіс на `/api/health` (503, якщо база недоступна).
- Резервні копії: у Supabase Pro увімкніть daily backups; фото журналу лежать у Storage окремо.
- Логи помилок дивіться в журналі хостингу: сповіщення Telegram, оплати й нагадування пишуть `console.error` при збої, але не ламають замовлення.

## 6. Чого немає без ваших даних
Живі Нова пошта, Stripe/LiqPay і Telegram не перевірялися (немає ключів). Перед відкриттям продажів пройдіть по одному тестовому замовленню на кожному способі оплати.
