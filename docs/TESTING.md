# Тестирование (приёмочный чеклист)

## Автоматические проверки

```bash
cd apps/web
npm run typecheck     # типы
npm test              # 54 теста: контент, коды, цены, заказы, платежи, Notion-маппинг, статистика, миграции и RLS (PGlite)
npm run build         # production-сборка
# сквозной тест в браузере (нужен запущенный сервер и демо-данные):
ENVV="ADMIN_PASSWORD=test123 ADMIN_EMAIL=admin TELEGRAM_BOT_TOKEN=123456:E2E TELEGRAM_WEBHOOK_SECRET=e2e-secret NEXT_PUBLIC_SITE_URL=http://localhost:3100"
env $ENVV npm run build && env $ENVV npx next start -p 3100 &
BASE=http://localhost:3100 TELEGRAM_BOT_TOKEN=123456:E2E TELEGRAM_WEBHOOK_SECRET=e2e-secret node tests/e2e/smoke.mjs
```

Сквозной тест (iPhone 13 + десктоп) проходит: перенаправление языка, поиск и фильтры, сканирование QR, баннер горшка, `.ics` напоминание, неверный код, корзина, валидацию формы, заказ, страницу заказа без персональных данных, переключатель языка, админку (вход, партии, выдачу QR горшков, аналитику, печатный лист QR), sitemap/robots, отсутствие горизонтального скролла и ошибок в консоли.

## Подключение Supabase и Notion

```bash
cd apps/web
# 1. Supabase: выполните supabase/migrations/0001_init.sql, затем 0002_catalog_items_journal.sql в SQL editor проекта, затем в .env.local:
#    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run check:connections      # проверяет таблицы и базы
npm run supabase:seed          # загружает 15 трав и 6 семейств в Supabase
# 2. Notion: импорт docs/notion-import/*.csv (см. docs/NOTION.md), затем NOTION_TOKEN, NOTION_DB_SPECIES, NOTION_DB_FAMILIES
npm run sync:notion            # Notion -> JSON + Supabase
```

## Что обязательно проверить руками (я не мог)

| # | Проверка | Как |
|---|---|---|
| 1 | **Реальный QR на реальном горшке** | Распечатайте лист из `/admin/pots/print`, наклейте/выжгите, отсканируйте 3 разными телефонами, при поливе и при слабом свете |
| 2 | Скорость на 4G | Lighthouse на странице растения (цель LCP < 2 с) |
| 3 | Платежи Stripe/LiqPay | Ключи в `.env`, тестовые платежи, вебхуки (Stripe CLI `stripe listen`) |
| 4 | Supabase | Применить `supabase/migrations/0001_init.sql`, заполнить `SUPABASE_*`, повторить заказ и скан: данные в таблицах |
| 5 | Notion | Создать базы по `docs/NOTION.md`, `npm run sync:notion`, проверить сообщения об ошибках |
| 6 | Тексты | Вычитка uk/en, проверка достоверности советов и безопасности для животных |
| 7 | Юридика | Заменить тексты оферты, доставки, конфиденциальности (сейчас заглушки) |
| 8 | Реальные цены и фото | Цены сейчас тестовые, иллюстрации заменить фотографиями |
| 9 | 5–7 юзабилити-тестов | Телефон, сканирование, найти полив, оформить заказ (см. `docs/UX.md`) |
