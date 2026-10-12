import type { L } from "@/lib/types";

type Section = { h: L; p: L };
export type InfoPage = { title: L; lead: L; sections: Section[]; draft?: boolean };

const l = (uk: string, en: string): L => ({ uk, en });

export const infoPages: Record<string, InfoPage> = {
  about: {
    title: l("Про нас", "About us"),
    lead: l("Ми ліпимо горщики вручну й садимо в них пряні трави, а кожен горщик має власний цифровий паспорт.", "We shape pots by hand and plant culinary herbs in them, and every pot has its own digital passport."),
    sections: [
      { h: l("Чому паспорт?", "Why a passport?"), p: l("Більшість рослин гине не через відсутність таланту, а через відсутність інструкції. QR-код на горщику відкриває догляд, який підходить саме вашій рослині.", "Most plants die from missing instructions, not missing talent. The QR code on the pot opens care advice made for exactly your plant.") },
      { h: l("Ручна робота", "Handmade"), p: l("Кожен горщик унікальний: глазур і форма трохи відрізняються, і це нормально.", "Every pot is unique: glaze and shape differ slightly, and that is normal.") },
    ],
  },
  delivery: {
    title: l("Доставка та оплата", "Delivery and payment"),
    lead: l("Тестовий текст: умови буде уточнено перед запуском.", "Draft text: terms will be finalised before launch."),
    draft: true,
    sections: [
      { h: l("Україна", "Ukraine"), p: l("Відправляємо Новою поштою у відділення. Вартість показано в кошику. Безкоштовна доставка від суми, вказаної в кошику.", "We ship by Nova Poshta to a branch. The cost is shown in the cart. Free shipping above the amount shown in the cart.") },
      { h: l("Міжнародна доставка", "International shipping"), p: l("Відправляємо у країни ЄС. Вартість і строки залежать від країни. Живі рослини надсилаємо лише в теплу пору або в утепленій упаковці.", "We ship to EU countries. Cost and time depend on the country. Live plants are sent only in warm periods or in insulated packaging.") },
      { h: l("Оплата", "Payment"), p: l("Оплата при отриманні (Україна) та картка. Картковими даними ми не володіємо: їх обробляє платіжний провайдер.", "Cash on delivery (Ukraine) and card. We never hold card data: the payment provider processes it.") },
    ],
  },
  warranty: {
    title: l("Гарантія та повернення", "Warranty and returns"),
    lead: l("Тестовий текст: юридичні умови буде затверджено перед запуском.", "Draft text: legal terms will be approved before launch."),
    draft: true,
    sections: [
      { h: l("Гарантія «Живе»", "“It lives” guarantee"), p: l("Якщо рослина загинула, хоча ви дотримувалися порад із паспорта, надішліть фото протягом 30 днів і ми замінимо її.", "If your plant died although you followed the passport advice, send a photo within 30 days and we will replace it.") },
      { h: l("Пошкодження в дорозі", "Damage in transit"), p: l("Сфотографуйте посилку при отриманні та напишіть нам протягом 48 годин.", "Photograph the parcel on arrival and write to us within 48 hours.") },
    ],
  },
  privacy: {
    title: l("Конфіденційність", "Privacy"),
    lead: l("Тестовий текст: політику буде перевірено юристом.", "Draft text: the policy will be reviewed by a lawyer."),
    draft: true,
    sections: [
      { h: l("Що ми збираємо", "What we collect"), p: l("Для замовлення: ім'я, контакти й адресу. Для аналітики сканів: країну, тип пристрою й анонімний щоденний хеш. IP-адреси ми не зберігаємо, cookies для відстеження не використовуємо.", "For orders: name, contact and address. For scan analytics: country, device type and an anonymous daily hash. We do not store IP addresses and do not use tracking cookies.") },
      { h: l("Ваші права", "Your rights"), p: l("Напишіть нам, і ми видалимо або передамо ваші дані.", "Write to us and we will delete or export your data.") },
    ],
  },
  terms: {
    title: l("Умови", "Terms"),
    lead: l("Тестовий текст: публічну оферту буде підготовлено перед запуском.", "Draft text: the public offer will be prepared before launch."),
    draft: true,
    sections: [
      { h: l("Замовлення", "Orders"), p: l("Оформлюючи замовлення, ви погоджуєтеся з умовами доставки й гарантії.", "By placing an order you agree to the delivery and warranty terms.") },
    ],
  },
  contact: {
    title: l("Контакти", "Contact"),
    lead: l("Напишіть нам, і ми відповімо протягом доби.", "Write to us and we will reply within a day."),
    sections: [
      { h: l("E-mail", "Email"), p: l("hello@example.com (тестова адреса)", "hello@example.com (test address)") },
    ],
  },
};

export type Guide = { slug: string; title: L; lead: L; steps: L[] };

export const guides: Guide[] = [
  {
    slug: "watering",
    title: l("Як правильно поливати", "How to water properly"),
    lead: l("Переливання вбиває трави частіше, ніж пересушування.", "Over-watering kills herbs more often than under-watering."),
    steps: [
      l("Встроміть палець у ґрунт на 2–3 см: якщо сухо, час поливати.", "Push a finger 2–3 cm into the soil: if dry, it is time to water."),
      l("Поливайте рясно, поки вода не вийде знизу, і злийте надлишок із піддону через 15 хвилин.", "Water thoroughly until it runs out of the bottom, then empty the saucer after 15 minutes."),
      l("Поливайте вранці й біля кореня, не на листя.", "Water in the morning at the base, not on the leaves."),
      l("Середземноморським травам (розмарин, чебрець, орегано, шавлія) дайте підсохнути сильніше, ніж базиліку чи м'яті.", "Let Mediterranean herbs (rosemary, thyme, oregano, sage) dry out more than basil or mint."),
    ],
  },
  {
    slug: "light",
    title: l("Світло для трав на підвіконні", "Light for herbs on a windowsill"),
    lead: l("Більшість пряних трав хочуть 6 і більше годин світла.", "Most culinary herbs want 6 or more hours of light."),
    steps: [
      l("Найкраще південне або західне вікно.", "A south or west window is best."),
      l("Якщо рослина витягується, їй не вистачає світла: додайте фітолампу на 10–12 годин на добу.", "If the plant stretches it needs more light: add a grow lamp for 10–12 hours a day."),
      l("Раз на тиждень повертайте горщик на чверть оберту.", "Rotate the pot a quarter turn once a week."),
    ],
  },
  {
    slug: "harvest",
    title: l("Як зрізати, щоб кущ ріс густіше", "How to cut so the plant grows bushier"),
    lead: l("Правильне зрізання - це і врожай, і форма куща.", "Proper cutting is both harvest and shaping."),
    steps: [
      l("Зрізайте верхівки над парою листків або над вузлом.", "Cut tips just above a pair of leaves or a node."),
      l("Не забирайте більше третини рослини за раз.", "Never take more than a third of the plant at once."),
      l("Квіткові стебла зрізайте на ранньому етапі, щоб листя залишалося смачним.", "Remove flower stalks early so the leaves stay tasty."),
    ],
  },
];
