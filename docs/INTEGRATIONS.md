# Інтеграції: що потрібно налаштувати

Усе задається змінними середовища (локально `apps/web/.env.local`, на хостингу в налаштуваннях проєкту). Значення в репозиторій не потрапляють. Без ключа відповідна функція тихо вимикається, сайт працює далі.

| Що | Змінні | Без цього |
|---|---|---|
| Вхід в адмінку | `ADMIN_EMAIL`, `ADMIN_PASSWORD` (`ADMIN_SESSION_SECRET` необов'язково) | у production адмінка вимкнена (503) |
| База даних | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, міграції `0001` і `0002` | локальний файл `.data/store.json` (лише розробка) |
| Контент з Notion | `NOTION_TOKEN`, `NOTION_DB_SPECIES`, `NOTION_DB_FAMILIES` | вбудовані 15 трав |
| Оплата карткою | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LIQPAY_PUBLIC_KEY`, `LIQPAY_PRIVATE_KEY` | лише оплата при отриманні |
| Повідомлення Каті в Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID` | повідомлень немає, замовлення видно в адмінці |
| Нова пошта: вибір міста й відділення | `NOVA_POSHTA_API_KEY` | на оформленні звичайні текстові поля |
| Нова пошта: автоматична ТТН | ще `NP_SENDER_CITY_REF`, `NP_SENDER_REF`, `NP_SENDER_ADDRESS_REF`, `NP_SENDER_CONTACT_REF`, `NP_SENDER_PHONE` | ТТН вводиться вручну |

## Як отримати значення

- **Telegram:** створіть бота в @BotFather (токен), напишіть боту `/start`, відкрийте `https://api.telegram.org/bot<токен>/getUpdates` і візьміть `chat.id`.
- **Нова пошта:** ключ API в особистому кабінеті (Налаштування → Безпека). Значення `NP_SENDER_*` (ref міста, контрагента, адреси відділення, контактної особи) беруться методами API `getCities`, `getCounterparties`, `getCounterpartyAddresses`, `getCounterpartyContactPersons`; телефон у форматі `380XXXXXXXXX`.
- **Stripe/LiqPay:** вебхуки `/api/webhooks/stripe` і `/api/webhooks/liqpay` на адресу вашого сайту.

## Що перевірено

Запити Нової пошти (місто, відділення, ТТН з накладеним платежем, відстеження) покриті тестами з імітацією відповіді, **на живому API не запускалися**: перший реальний тест потрібен з вашим ключем. Те саме для Stripe/LiqPay (підписи вебхуків перевірені юніт-тестами).
