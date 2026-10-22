import type { CareSection } from "@/lib/domain";
import type { L } from "@/lib/types";

/**
 * Care texts for baskets (sets), in the sections of the customer's card template.
 * PLACEHOLDER copy: Katya replaces it (Notion/admin) before launch; see docs/TESTING.md.
 */
export type BasketContent = Record<CareSection, L>;

export const basketContent: Record<string, BasketContent> = {
  "set-tea": {
    description: {
      uk: "Чайний кошик: м'ята, меліса та шавлія в одному плетеному кошику. Зривайте листя, заливайте окропом і пийте свіжий чай просто зі свого підвіконня.",
      en: "A tea basket: mint, lemon balm and sage together in one woven basket. Pick the leaves, pour over hot water and enjoy fresh tea straight from your windowsill.",
    },
    watering: {
      uk: "Поливайте, коли верхній шар ґрунту підсох на 2–3 см, зазвичай раз на 2–3 дні влітку. М'ята і меліса люблять вологість, шавлія - сухіше, тому лийте ближче до м'яти й меліси. Вода не повинна стояти в піддоні.",
      en: "Water when the top 2–3 cm of soil is dry, usually every 2–3 days in summer. Mint and lemon balm like moisture, sage prefers it drier, so pour nearer to the mint and balm. Never leave water standing in the saucer.",
    },
    placement: {
      uk: "Яскраве розсіяне світло або схід/захід. Пів дня прямого сонця достатньо; у спеку на південному вікні листя може обгоріти. Обертайте кошик раз на тиждень, щоб рослини росли рівно.",
      en: "Bright indirect light, or an east/west window. Half a day of direct sun is enough; on a hot south window the leaves can scorch. Turn the basket once a week so the plants grow evenly.",
    },
    seasonal: {
      uk: "Весна-літо: ріст і щоденний збір, підживлення раз на 3-4 тижні слабким добривом. Осінь: менше поливу, прохолодніше місце. Зима: світле прохолодне місце, помірний полив, шавлії потрібен спокій.",
      en: "Spring-summer: growth and regular picking, feed every 3–4 weeks with a weak fertiliser. Autumn: water less, move somewhere cooler. Winter: a bright cool spot, moderate watering; sage needs a rest.",
    },
    katya_tips: {
      uk: "Зривайте верхівки стебел, а не окремі листки: так кущ густішає. Не дайте м'яті захопити весь кошик, підрізайте її щотижня. Кілька листків меліси ввечері заспокоюють краще за будь-яку рекламу.",
      en: "Pick the tips of the stems rather than single leaves: the plant gets bushier. Do not let the mint take over the basket, trim it weekly. A few lemon balm leaves in the evening beat any advert.",
    },
    kitchen: {
      uk: "Чай: по 3-4 листки м'яти й меліси та 1 лист шавлії на чашку, 5 хвилин під кришкою. Влітку: холодний чай з льодом і лимоном. Шавлію додавайте помірно, вона насичена.",
      en: "Tea: 3–4 leaves each of mint and lemon balm and 1 sage leaf per cup, steep 5 minutes covered. In summer: iced tea with lemon. Use sage sparingly, it is strong.",
    },
  },
  "set-italian": {
    description: {
      uk: "Італійський кошик: базилік, орегано, чебрець і розмарин для піци, пасти та печеної картоплі.",
      en: "An Italian basket: basil, oregano, thyme and rosemary for pizza, pasta and roast potatoes.",
    },
    watering: {
      uk: "Базилік любить вологий ґрунт, а розмарин, чебрець і орегано - підсихання. Поливайте, коли верхні 2-3 см сухі, біля кореня й вранці. Розмарин легко переливається: сумніваєтесь - почекайте день.",
      en: "Basil likes moist soil, while rosemary, thyme and oregano like to dry out. Water when the top 2–3 cm are dry, at the base and in the morning. Rosemary is easy to overwater: if in doubt, wait a day.",
    },
    placement: {
      uk: "Найсонячніше вікно: потрібно 6 і більше годин світла. Взимку додайте лампу. Тримайте подалі від протягів: базилік не терпить холоду.",
      en: "Your sunniest window: it needs 6+ hours of light. Add a lamp in winter. Keep away from drafts, basil dislikes the cold.",
    },
    seasonal: {
      uk: "Літо: ріст і збір. Взимку базилік слабшає, а розмарин і чебрець люблять прохолоду (5-12 °C) і мало води. Весною замініть базилік свіжим.",
      en: "Summer: growth and harvest. In winter basil weakens, while rosemary and thyme like it cool (5–12 °C) and dry. Replace the basil with a fresh plant in spring.",
    },
    katya_tips: {
      uk: "Прищипуйте базилік над парою листків і прибирайте квіткові бруньки. Розмарин зрізайте не більше третини за раз.",
      en: "Pinch basil just above a pair of leaves and remove flower buds. Cut rosemary by no more than a third at a time.",
    },
    kitchen: {
      uk: "Базилік - у кінці готування, розмарин і чебрець - у запечене м'ясо й картоплю, орегано - у піцу й томатні соуси.",
      en: "Basil goes in at the end, rosemary and thyme into roasts and potatoes, oregano into pizza and tomato sauces.",
    },
  },
  "set-asian": {
    description: {
      uk: "Азійський кошик: базилік, лемонграс і кінза для супів, каррі та свіжих салатів.",
      en: "An Asian basket: basil, lemongrass and cilantro for soups, curries and fresh salads.",
    },
    watering: {
      uk: "Лемонграс любить багато води, кінза - рівномірну вологість, базилік - вологий, але не мокрий ґрунт. Поливайте щоразу, коли верхній шар підсох, і не давайте повністю пересихати.",
      en: "Lemongrass likes plenty of water, cilantro even moisture, and basil moist but not wet soil. Water whenever the top layer dries and never let it dry out completely.",
    },
    placement: {
      uk: "Тепло й світло: південне або західне вікно. Лемонграс не терпить холоду нижче 10 °C. Кінзі в спеку краще півтінь.",
      en: "Warm and bright: a south or west window. Lemongrass cannot take cold below 10 °C. Cilantro prefers part shade in the heat.",
    },
    seasonal: {
      uk: "Влітку все росте швидко; кінза швидко викидає стрілку, тому сійте нову партію кожні 3-4 тижні. Взимку тримайте кошик у теплі й під лампою.",
      en: "Everything grows fast in summer; cilantro bolts quickly, so sow a new batch every 3–4 weeks. In winter keep the basket warm and under a lamp.",
    },
    katya_tips: {
      uk: "Стебла лемонграсу зрізайте біля основи, коли вони товщі за олівець. Кінзу зрізайте із зовнішніх листків.",
      en: "Cut lemongrass stalks at the base once they are thicker than a pencil. Cut cilantro from the outer leaves.",
    },
    kitchen: {
      uk: "Том ям і каррі: лемонграс розім'яти, а кінзу й базилік додати наприкінці. Чудово для лаймового чаю й маринадів.",
      en: "Tom yum and curry: bruise the lemongrass and add cilantro and basil at the end. Great for lime tea and marinades.",
    },
  },
};
