export type Loc = "uk" | "en";

const uk = {
  title: "Мої горщики", hello: (n: string | null) => (n ? `Привіт, ${n}` : "Привіт"), loading: "Завантаження…", error: "Щось пішло не так. Спробуйте ще раз.",
  openIn: "Відкрийте цю сторінку з Telegram-бота, щоб побачити свої горщики.",
  tabToday: "Сьогодні", tabGarden: "Горщики", tabScan: "Скан", tabProfile: "Профіль",
  todayTitle: "Сьогодні", todayEmpty: "На сьогодні задач немає", todayEmptyText: "Нагадування з'являться тут, коли настане час поливу чи підживлення.",
  taskWater: "Полити", taskFeed: "Підгодувати", taskPhoto: "Зробити фото-звіт", done: "Зроблено", snooze: "Відкласти", overdue: "Прострочено",
  gardenTitle: "Мої горщики", gardenEmpty: "У вас ще немає горщиків", gardenEmptyText: "Відскануйте QR-код на горщику, і він з'явиться тут.", addPot: "Додати горщик",
  back: "Усі горщики", potName: "Ім'я горщика", potNamePh: "Наприклад, «Зелений сніданок»", save: "Зберегти", saved: "Збережено", card: "Картка горщика",
  journal: "Журнал догляду", add: "Додати запис", kind: "Тип запису", note: "Нотатка", notePh: "Що ви помітили?", light: "Освітлення", watered: "Полив", wateredYes: "Полив зроблено",
  photos: "Фото (до 6)", send: "Зберегти запис", entrySaved: "Запис додано", noEntries: "Записів ще немає", remove: "Видалити", removeAsk: "Видалити запис?",
  kindNote: "Нотатка", kindCare: "Догляд", kindPhoto_report: "Фото-звіт", kindProblem: "Проблема", kindHarvest: "Збір урожаю", kindQuestion: "Питання",
  lightBright: "Яскраве", lightDiffused: "Розсіяне", lightLow: "Слабке", lightNone: "Не вказувати",
  ask: "Запитати Катю", askPh: "Опишіть, що вас турбує", symptom: "Що сталося?", sendQ: "Надіслати", sent: "Питання надіслано Каті.", firstAid: "Перша допомога", waiting: "Чекає на відповідь", katya: "Катя",
  scanTitle: "Додати горщик", scanButton: "Сканувати QR", scanHint: "Наведіть камеру на QR-код на горщику.", orCode: "Або введіть код з наклейки", codePh: "ABCD-EFGH",
  confirmQ: (c: string) => `Додати горщик ${c} до вашого списку?`, confirm: "Так, це мій", notFound: "Такого горщика не знайдено.", taken: "Цей горщик уже належить комусь іншому.", notSold: "Цей горщик ще не продано, тому додати його не можна.", badCode: "Код введено з помилкою. Перевірте наклейку.", activated: "Горщик додано",
  profileTitle: "Профіль", notify: "Нагадування в Telegram", quiet: "Тихі години", quietFrom: "З", quietUntil: "До", timezone: "Часовий пояс", language: "Мова",
  tooBig: "Фото завелике", badPhoto: "Потрібне фото у форматі JPEG, PNG або WebP", tooMany: "Не більше 6 фото",
};
const en: typeof uk = {
  title: "My pots", hello: (n) => (n ? `Hi, ${n}` : "Hi"), loading: "Loading…", error: "Something went wrong. Please try again.",
  openIn: "Open this page from the Telegram bot to see your pots.",
  tabToday: "Today", tabGarden: "Pots", tabScan: "Scan", tabProfile: "Profile",
  todayTitle: "Today", todayEmpty: "Nothing to do today", todayEmptyText: "Reminders show up here when it is time to water or feed.",
  taskWater: "Water", taskFeed: "Feed", taskPhoto: "Take a photo update", done: "Done", snooze: "Snooze", overdue: "Overdue",
  gardenTitle: "My pots", gardenEmpty: "You have no pots yet", gardenEmptyText: "Scan the QR code on your pot and it will show up here.", addPot: "Add a pot",
  back: "All pots", potName: "Pot name", potNamePh: "For example, “Green breakfast”", save: "Save", saved: "Saved", card: "Pot card",
  journal: "Care journal", add: "Add an entry", kind: "Entry type", note: "Note", notePh: "What did you notice?", light: "Light", watered: "Watering", wateredYes: "Watered",
  photos: "Photos (up to 6)", send: "Save entry", entrySaved: "Entry added", noEntries: "No entries yet", remove: "Delete", removeAsk: "Delete this entry?",
  kindNote: "Note", kindCare: "Care", kindPhoto_report: "Photo update", kindProblem: "Problem", kindHarvest: "Harvest", kindQuestion: "Question",
  lightBright: "Bright", lightDiffused: "Diffused", lightLow: "Low", lightNone: "Do not specify",
  ask: "Ask Katya", askPh: "Describe what worries you", symptom: "What happened?", sendQ: "Send", sent: "Question sent to Katya.", firstAid: "First aid", waiting: "Waiting for an answer", katya: "Katya",
  scanTitle: "Add a pot", scanButton: "Scan QR", scanHint: "Point the camera at the QR code on your pot.", orCode: "Or type the code from the sticker", codePh: "ABCD-EFGH",
  confirmQ: (c) => `Add pot ${c} to your list?`, confirm: "Yes, it's mine", notFound: "We could not find this pot.", taken: "This pot already belongs to someone else.", notSold: "This pot has not been sold yet, so it cannot be added.", badCode: "The code has a typo. Check the sticker.", activated: "Pot added",
  profileTitle: "Profile", notify: "Reminders in Telegram", quiet: "Quiet hours", quietFrom: "From", quietUntil: "To", timezone: "Time zone", language: "Language",
  tooBig: "The photo is too large", badPhoto: "Use a JPEG, PNG or WebP photo", tooMany: "At most 6 photos",
};

export const TEXT: Record<Loc, typeof uk> = { uk, en };
export type T = typeof uk;
