import type { L, Locale } from "./types";

export const locales: Locale[] = ["uk", "en"];
export const defaultLocale: Locale = "uk";

export function isLocale(v: string | undefined | null): v is Locale {
  return v === "uk" || v === "en";
}

/** Picks the best locale from an Accept-Language header. Ukrainian and Russian speakers get uk. */
export function detectLocale(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  const tags = header
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag.startsWith("uk") || tag.startsWith("ru")) return "uk";
    if (tag.startsWith("en")) return "en";
  }
  return defaultLocale;
}

export const pick = (v: L, locale: Locale) => v[locale] ?? v.uk;

const d = (uk: string, en: string): L => ({ uk, en });

export const dict = {
  brand: d("Spicy Hemp", "Spicy Hemp"),
  skip: d("Перейти до змісту", "Skip to content"),
  nav_plants: d("Рослини", "Plants"),
  nav_shop: d("Магазин", "Shop"),
  nav_guides: d("Гайди", "Guides"),
  nav_about: d("Про нас", "About"),
  nav_cart: d("Кошик", "Cart"),
  nav_home: d("Головна", "Home"),
  menu: d("Меню", "Menu"),
  lang_switch: d("English", "Українська"),
  hero_title: d("Ручні горщики. Живі прянощі. Паспорт у кожного.", "Handmade pots. Living herbs. A passport for each."),
  hero_text: d(
    "Кожен горщик ми ліпимо вручну та садимо в нього пряну траву. Скануйте QR-код на горщику й одразу знайте, як нею опікуватися.",
    "We shape every pot by hand and plant a culinary herb in it. Scan the QR code on the pot and know right away how to look after it.",
  ),
  cta_shop: d("Обрати горщик", "Choose a pot"),
  cta_plants: d("Довідник рослин", "Plant guide"),
  how_title: d("Як це працює", "How it works"),
  how_1_t: d("Отримуєте горщик", "Get your pot"),
  how_1_d: d("Ручна кераміка з живою травою всередині.", "Handmade ceramics with a living herb inside."),
  how_2_t: d("Скануєте QR", "Scan the QR"),
  how_2_d: d("Паспорт рослини відкривається одразу, без реєстрації.", "The plant passport opens right away, no sign-up."),
  how_3_t: d("Доглядаєте та готуєте", "Care and cook"),
  how_3_d: d("Нагадування про полив, поради та рецепти.", "Watering reminders, tips and recipes."),
  popular: d("Популярні трави", "Popular herbs"),
  sets_title: d("Набори для подарунка", "Gift sets"),
  all_plants: d("Усі рослини", "All plants"),
  all_products: d("Увесь магазин", "Whole shop"),
  warranty_title: d("Гарантія «Живе»", "“It lives” guarantee"),
  warranty_text: d(
    "Якщо рослина загинула, хоча ви дотримувалися поради з паспорта, ми замінимо її протягом 30 днів.",
    "If your plant died although you followed the passport, we will replace it within 30 days.",
  ),
  difficulty: d("Складність", "Difficulty"),
  diff_1: d("Легко", "Easy"),
  diff_2: d("Середньо", "Medium"),
  diff_3: d("Складно", "Hard"),
  light: d("Світло", "Light"),
  water: d("Полив", "Water"),
  temperature: d("Температура", "Temperature"),
  humidity: d("Вологість", "Humidity"),
  hum_low: d("низька", "low"),
  hum_medium: d("середня", "medium"),
  hum_high: d("висока", "high"),
  hours: d("год світла", "h of light"),
  every_days: d("кожні {n} дн.", "every {n} days"),
  daily: d("щодня", "daily"),
  pot_size: d("Горщик від", "Pot from"),
  pet: d("Для тварин", "For pets"),
  pet_safe: d("Безпечна", "Safe"),
  pet_caution: d("З обережністю", "Use caution"),
  pet_unknown: d("Перевірте", "Check first"),
  pet_note: d(
    "Інформація про безпеку для тварин довідкова. Якщо тварина з'їла рослину, зверніться до ветеринара.",
    "Pet-safety information is a reference only. If your pet eats the plant, contact a vet.",
  ),
  cycle_annual: d("Однорічна", "Annual"),
  cycle_biennial: d("Дворічна", "Biennial"),
  cycle_perennial: d("Багаторічна", "Perennial"),
  cycle_shrub: d("Напівчагарник", "Subshrub"),
  cycle_tree: d("Дерево", "Tree"),
  cycle_tropical: d("Тропічна багаторічна", "Tropical perennial"),
  sec_light: d("Світло", "Light"),
  sec_water: d("Полив", "Watering"),
  sec_feeding: d("Підживлення", "Feeding"),
  sec_harvest: d("Збір і обрізка", "Harvest and pruning"),
  sec_winter: d("Зима та спокій", "Winter and rest"),
  sec_uses: d("Застосування", "Uses"),
  sec_problems: d("Проблеми та рішення", "Problems and fixes"),
  sec_varieties: d("Сорти", "Varieties"),
  sec_family: d("Родина", "Family"),
  sec_companions: d("Гарні сусіди", "Good companions"),
  alone: d("Краще у власному горщику: агресивно росте або пригнічує сусідів.", "Best in its own pot: it spreads or suppresses neighbours."),
  your_pot: d("Ваш горщик", "Your pot"),
  batch: d("партія", "batch"),
  planted: d("посаджено", "planted"),
  remind_title: d("Нагадати про полив", "Remind me to water"),
  remind_text: d("Додайте повторювану подію до календаря: без реєстрації.", "Add a repeating event to your calendar, no sign-up."),
  remind_btn: d("Додати в календар", "Add to calendar"),
  buy_again: d("Купити ще такий", "Buy another"),
  gift_same: d("Подарувати такий самий", "Gift one like this"),
  view_in_shop: d("Придбати горщик", "Get this pot"),
  search_ph: d("Пошук рослини…", "Search plants…"),
  filter_all: d("Усі", "All"),
  filter_easy: d("Легкі", "Easy"),
  filter_sun: d("Любить сонце", "Sun lovers"),
  filter_pet: d("Безпечні для тварин", "Pet-safe"),
  filter_perennial: d("Багаторічні", "Perennial"),
  no_results: d("Нічого не знайдено. Спробуйте інше слово.", "Nothing found. Try another word."),
  results: d("результатів", "results"),
  shop_title: d("Магазин", "Shop"),
  pot_label: d("Горщик ручної роботи", "Handmade pot"),
  glaze: d("Глазур", "Glaze"),
  glaze_sage: d("Шавлія", "Sage"),
  glaze_cream: d("Вершки", "Cream"),
  glaze_terracotta: d("Теракота", "Terracotta"),
  add_to_cart: d("Додати в кошик", "Add to cart"),
  added: d("Додано в кошик", "Added to cart"),
  in_stock: d("В наявності", "In stock"),
  price_note: d("Тестові ціни", "Test prices"),
  set_save: d("Економія 10%", "Save 10%"),
  includes: d("У наборі", "Includes"),
  cart_title: d("Кошик", "Cart"),
  cart_empty: d("Кошик порожній", "Your cart is empty"),
  cart_empty_t: d("Оберіть горщик із живою травою, і ми його упакуємо.", "Pick a pot with a living herb and we will pack it."),
  qty: d("Кількість", "Quantity"),
  remove: d("Видалити", "Remove"),
  subtotal: d("Сума", "Subtotal"),
  shipping: d("Доставка", "Shipping"),
  free: d("Безкоштовно", "Free"),
  total: d("Разом", "Total"),
  free_ship_hint: d("Ще {n} до безкоштовної доставки", "{n} more for free shipping"),
  checkout: d("Оформити замовлення", "Checkout"),
  continue_shopping: d("Продовжити покупки", "Continue shopping"),
  contacts: d("Контакти", "Contact"),
  name: d("Ім'я та прізвище", "Full name"),
  phone: d("Телефон", "Phone"),
  email: d("E-mail", "Email"),
  delivery: d("Доставка", "Delivery"),
  country: d("Країна", "Country"),
  city: d("Місто", "City"),
  np_branch: d("Відділення Нової пошти", "Nova Poshta branch"),
  address: d("Адреса", "Address"),
  postcode: d("Поштовий індекс", "Postcode"),
  ship_np: d("Нова пошта (Україна)", "Nova Poshta (Ukraine)"),
  ship_intl: d("Міжнародна доставка", "International shipping"),
  gift: d("Це подарунок", "This is a gift"),
  gift_msg: d("Текст листівки", "Card message"),
  gift_hide: d("Ціна не вказується у посилці.", "The price is left out of the parcel."),
  note: d("Коментар до замовлення", "Order note"),
  payment: d("Оплата", "Payment"),
  pay_cod: d("Оплата при отриманні", "Pay on delivery"),
  pay_stripe: d("Картка (Stripe)", "Card (Stripe)"),
  pay_liqpay: d("Картка (LiqPay)", "Card (LiqPay)"),
  place_order: d("Підтвердити замовлення", "Place order"),
  placing: d("Оформлюємо…", "Placing order…"),
  required: d("Заповніть це поле", "This field is required"),
  invalid_email: d("Перевірте e-mail", "Check the email address"),
  invalid_phone: d("Перевірте телефон", "Check the phone number"),
  terms_agree: d("Погоджуюсь з умовами доставки та поверненням", "I agree to the delivery and returns terms"),
  order_thanks: d("Дякуємо! Замовлення прийнято", "Thank you! Order received"),
  order_no: d("Номер замовлення", "Order number"),
  order_status: d("Статус", "Status"),
  order_next: d("Що далі", "What's next"),
  order_next_text: d(
    "Ми підтвердимо замовлення та надішлемо трек-номер. На горщику буде QR-код: відскануйте його, щойно отримаєте.",
    "We will confirm the order and send a tracking number. The pot carries a QR code: scan it as soon as it arrives.",
  ),
  status_new: d("Нове", "New"),
  status_pending_payment: d("Очікує оплату", "Awaiting payment"),
  status_paid: d("Оплачено", "Paid"),
  status_packed: d("Упаковано", "Packed"),
  status_shipped: d("Відправлено", "Shipped"),
  status_delivered: d("Доставлено", "Delivered"),
  status_cancelled: d("Скасовано", "Cancelled"),
  guides_title: d("Гайди з догляду", "Care guides"),
  footer_about: d("Ручні горщики з живими пряними травами та цифровим паспортом.", "Handmade pots with living culinary herbs and a digital passport."),
  footer_help: d("Допомога", "Help"),
  delivery_page: d("Доставка та оплата", "Delivery and payment"),
  warranty_page: d("Гарантія та повернення", "Warranty and returns"),
  privacy_page: d("Конфіденційність", "Privacy"),
  terms_page: d("Умови", "Terms"),
  contact_page: d("Контакти", "Contact"),
  pot_not_found: d("Горщик не знайдено", "Pot not found"),
  pot_not_found_t: d("Перевірте код на горщику або знайдіть рослину в довіднику.", "Check the code on the pot or find the plant in the guide."),
  enter_code: d("Введіть код з горщика", "Enter the code from the pot"),
  open: d("Відкрити", "Open"),
  back: d("Назад", "Back"),
  not_found: d("Сторінку не знайдено", "Page not found"),
  error_t: d("Щось пішло не так", "Something went wrong"),
  try_again: d("Спробувати ще раз", "Try again"),
  disclaimer: d(
    "Поради довідкові й не замінюють консультацію ветеринара чи лікаря. Тестові дані: матеріали проходять редакційну перевірку.",
    "Advice is for reference and does not replace a vet or doctor. Test data: content is under editorial review.",
  ),
  scan_hello: d("Ви відсканували горщик", "You scanned a pot"),
  tab_overview: d("Огляд", "Overview"),
  tab_care: d("Догляд", "Care"),
  tab_problems: d("Проблеми", "Problems"),
  tab_uses: d("Рецепти", "Uses"),
  quick_facts: d("Коротко", "At a glance"),
  related_family: d("Інші рослини родини", "More in this family"),
  latin: d("Латинська назва", "Latin name"),
  life_cycle: d("Життєвий цикл", "Life cycle"),
} satisfies Record<string, L>;

export type DictKey = keyof typeof dict;

export function t(locale: Locale, key: DictKey, vars?: Record<string, string | number>): string {
  let s = dict[key][locale] ?? dict[key].uk;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
