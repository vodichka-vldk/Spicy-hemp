# Notion: шаблон базы знаний

Notion это редакторская среда. Сайт берёт контент не из Notion в момент запроса, а из результата синхронизации (`npm run sync:notion`), поэтому он быстрый и не зависит от лимитов Notion.

## Быстрый импорт 15 трав

Готовые CSV лежат в `docs/notion-import/` (`families.csv`, `species.csv`), пересоздать: `npm run notion:export` в `apps/web`.

1. В Notion: **New page → Table → … → Import → CSV**, отдельно для каждого файла.
2. Поменяйте типы колонок: Status, Family, Cycle, Humidity, Pet safe, Light level → **Select**; Difficulty, Water every days, Temp min/max, Pot cm, Price UAH → **Number**; Alone in pot → **Checkbox** (Yes/No); Companions → **Multi-select**.
3. Подключите интеграцию к обеим базам и запустите `npm run check:connections`, затем `npm run sync:notion`.

## Как подключить

1. Создайте интеграцию в Notion (Settings → Connections → Develop or manage integrations), скопируйте токен в `NOTION_TOKEN`.
2. Создайте две базы данных (Table) ниже и подключите интеграцию к каждой (… → Connections).
3. Скопируйте ID баз (часть URL перед `?v=`) в `NOTION_DB_SPECIES` и `NOTION_DB_FAMILIES`.
4. Запустите `npm run sync:notion`. Скрипт сообщит о каждой неполной строке, и сайт не получит битый контент.
5. Перезапустите сборку на хостинге (deploy hook), чтобы изменения появились на сайте. Для автоматики подключите webhook Notion или cron.

Публикуются **только** строки со `Status = Published`. Черновики и «На проверке» на сайт не попадают.

## База «Families»

| Свойство | Тип | Пример |
|---|---|---|
| Slug | Title | `lamiaceae` |
| Status | Select | Draft / Review / Published |
| Latin | Text | Lamiaceae |
| Name uk / Name en | Text | Глухокропивові (Губоцвіті) / Mint family |
| Description uk / Description en | Text | абзац |

## База «Species»

| Свойство | Тип | Правила |
|---|---|---|
| Slug | Title | латиница, дефисы: `lemon-balm` |
| Status | Select | Draft / Review / Published |
| Latin | Text | *Ocimum basilicum* |
| Family | Select | slug семейства из базы Families |
| Cycle | Select | `annual`, `biennial`, `perennial`, `shrub`, `tree`, `tropical` |
| Difficulty | Number | 1, 2 или 3 |
| Light level | Select | `sun`, `bright`, `partial` |
| Light hours | Text | `6+` или `4–6` |
| Water every days | Number | интервал напоминания |
| Humidity | Select | `low`, `medium`, `high` |
| Pet safe | Select | `safe`, `caution`, `unknown`: **только после проверки по ASPCA/ветеринару** |
| Temp min / Temp max | Number | °C, min < max |
| Pot cm | Number | минимальный диаметр |
| Price UAH | Number | цена травы без горшка |
| Color | Text | `#3f8f4a`, цвет иллюстрации |
| Alone in pot | Checkbox | агрессивные виды |
| Companions | Multi-select | slugs других видов |
| Name uk / en, Tagline uk / en, Water note uk / en | Text | |
| Light uk/en, Water uk/en, Feeding uk/en, Harvest uk/en, Winter uk/en, Uses uk/en | Text | разделы паспорта |
| Problems uk / Problems en | Text | по строке на проблему: `симптом => что делать`. **Одинаковое число строк и порядок в uk и en, минимум 3** |
| Varieties | Text | по строке: `Название \| заметка uk \| заметка en`, минимум 2 |

### Чек-лист качества перед `Published`

- [ ] Латинское название и семейство проверены по RHS / Kew / Missouri Botanical Garden.
- [ ] Данные о безопасности для животных проверены по первоисточнику.
- [ ] Советы по поливу и свету проверены на реальном растении в таком горшке.
- [ ] Оба языка заполнены и читаются естественно.
- [ ] Для медицинских утверждений («от простуды», «успокаивает») есть источник или формулировка смягчена.

## Текущий рабочий экземпляр

Базы созданы в Notion и заполнены из `docs/notion-import/*.csv` (6 семейств, 15 видов, типы колонок выставлены по таблицам выше). Они лежат в личном пространстве владельца интеграции; подключите к обеим вашу интеграцию (… → Connections).

```
NOTION_DB_FAMILIES=e5078d912368416b8e859eb0bf76bd6f
NOTION_DB_SPECIES=c39319579e4a4e6eb40fc4581d757c16
```

`NOTION_TOKEN` и ключи Supabase задаются переменными окружения сессии/хостинга, в репозиторий не коммитятся.
