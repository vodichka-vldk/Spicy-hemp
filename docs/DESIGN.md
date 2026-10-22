# Дизайн-система

Весь інтерфейс (сайт, застосунок у Telegram, адмінка) зроблений за дизайн-системою Spicy Hemp: токени, компоненти, правила. Правила й сценарії лежать у `docs/design-system/README.md` і `FLOW.md` (копія з дизайн-системи). Нові екрани збирайте з її компонентів, а не з власних стилів.

## Де що лежить
| Що | Де |
|---|---|
| Токени (кольори трьох тем, типографіка, відступи, радіуси, тіні) | `apps/web/src/ds/tokens.json` → `tokens.css` (генерується) |
| Стилі компонентів | `apps/web/src/ds/components.css` |
| Компоненти (Button, PlantCard, ProductCard, PlantHero, Header, TabBar, Alert, Timeline та інші, 53) | `apps/web/src/ds/components.tsx` (генерується), типи в `src/ds/index.ts` |
| Шрифти Onest і Raleway Italic (self-hosted) | `src/ds/fonts.ts` |

Імпорт: `import { Button, PlantCard, Grid } from "@/ds"`.

## Теми
- `garden` (за замовчуванням): сайт, паспорт, Mini App. На `<html data-theme="garden">`.
- `light`: адмінка.
- `dark`: у системі є, у проєкті поки не вмикається.

## Правила, які легко порушити
- Без емодзі в інтерфейсі, тільки `Icon` (імена в `Icon.names`). Емодзі лишаються лише в повідомленнях Telegram.
- Кольори, відступи, радіуси лише токенами (`var(--ink)`, `var(--space-4)`). Не `#hex` і не `text-green-500`.
- Одна головна кнопка на екрані. `accent` (оранжевий) для купівлі, `action` (лайм) для додавання й переходів.
- Типографіка класами системи (`h1`, `body`, `body-sm`, `title`, `plant-name`), не власними розмірами. `plant-name` лише для великих назв рослин.
- Назви рослин і наборів у hero: `PlantHero`. Каталоги: `Grid cols="cards"` із `PlantCard`/`ProductCard`.
- Старі класи `card`, `btn`, `chip`, `badge`, `input`, `field` ще працюють (вони змінені на токени), але в нових місцях беріть компоненти системи.

## Як оновити систему
1. Скачайте файли дизайн-системи (`project/tokens.json`, `project/components/bundle.js`, `bundle.css`, `index.d.ts`) у теку.
2. `node apps/web/scripts/port-ds.mjs <тека>` переносить їх у `src/ds` (посилання йдуть через `next/link`).
3. `npm run ds:tokens` перегенерує `tokens.css`.
4. Зберіть проєкт і запустіть тести. Якщо з'явився новий компонент, додайте його до `src/ds/index.ts`.

## Що ще не на системі
Форма оформлення замовлення (`CheckoutForm`) і більшість таблиць адмінки поки на старих класах із новими токенами: вони виглядають у стилі системи, але не використовують `Input`, `RadioCard`, `DataTable`. Їх переведемо наступним кроком.
