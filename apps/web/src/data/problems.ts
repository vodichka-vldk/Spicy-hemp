import type { Problem } from "@/lib/types";

export const common = {
  overwater: {
    symptom: { uk: "Листя жовтіє, ґрунт завжди мокрий", en: "Leaves turn yellow, soil always wet" },
    fix: {
      uk: "Поливайте рідше: давайте верхньому шару підсохнути. Перевірте, що вода виходить через дренажний отвір і не стоїть у піддоні.",
      en: "Water less often: let the top layer dry first. Make sure water drains out of the hole and does not sit in the saucer.",
    },
  },
  underwater: {
    symptom: { uk: "Рослина в'яне, листя сухе й ламке", en: "Plant wilts, leaves are dry and brittle" },
    fix: {
      uk: "Рясно полийте, щоб вода вийшла знизу. Якщо ґрунт відсох від країв, поставте горщик у миску з водою на 15 хвилин.",
      en: "Water thoroughly until it drains out. If soil shrank from the edges, stand the pot in a bowl of water for 15 minutes.",
    },
  },
  leggy: {
    symptom: { uk: "Витягується, стебла тонкі, листя рідке", en: "Stretching, thin stems, sparse leaves" },
    fix: {
      uk: "Не вистачає світла: перенесіть на найсвітліше вікно або додайте фітолампу, прищипуйте верхівки.",
      en: "Not enough light: move to the brightest window or add a grow light, and pinch the tips.",
    },
  },
  aphids: {
    symptom: { uk: "Липкий наліт, дрібні комахи на молодих листках", en: "Sticky film, tiny insects on young leaves" },
    fix: {
      uk: "Змийте струменем води, протріть листки розчином м'якого мила. Ізолюйте рослину від сусідніх.",
      en: "Rinse off with water and wipe leaves with a mild soap solution. Isolate the plant from its neighbours.",
    },
  },
  mildew: {
    symptom: { uk: "Білий борошнистий наліт на листі", en: "White powdery coating on leaves" },
    fix: {
      uk: "Покращте циркуляцію повітря, не мочіть листя, видаліть уражені частини. Не ставте тісно.",
      en: "Improve air circulation, do not wet the leaves and remove affected parts. Avoid crowding.",
    },
  },
  bolting: {
    symptom: { uk: "Викинула стрілку, листя дрібнішає й гіркне", en: "Sent up a flower stalk, leaves get small and bitter" },
    fix: {
      uk: "Це реакція на спеку й довгий день. Зріжте стрілку, перенесіть у прохолоду, а наступну партію висівайте через 3–4 тижні.",
      en: "A reaction to heat and long days. Cut the stalk, move somewhere cooler and sow the next batch in 3–4 weeks.",
    },
  },
} satisfies Record<string, Problem>;
