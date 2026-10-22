/** Domain vocabulary shared by the app. The DB mirrors the transition tables (supabase/migrations/0002), a test keeps them in sync. */

export const ITEM_KINDS = ["basket", "single"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const ITEM_STATUSES = [
  "draft", "ready_for_sale", "reserved", "sold", "shipped", "delivered", "activated", "returned", "written_off", "archived",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  draft: ["ready_for_sale", "archived"],
  ready_for_sale: ["reserved", "sold", "archived", "written_off"],
  reserved: ["ready_for_sale", "sold"],
  sold: ["shipped", "ready_for_sale", "returned"],
  shipped: ["delivered", "returned"],
  delivered: ["activated", "returned"],
  activated: ["archived", "returned"],
  returned: ["ready_for_sale", "written_off"],
  written_off: [],
  archived: [],
};

export const ORDER_STATUSES = [
  "new", "pending_payment", "cod_confirmed", "payment_failed", "paid", "processing", "packed", "shipped", "delivered",
  "completed", "cancelled", "refund_requested", "refunded", "return_requested", "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["pending_payment", "cod_confirmed", "cancelled"],
  pending_payment: ["paid", "payment_failed", "cancelled"],
  payment_failed: ["pending_payment", "cancelled"],
  cod_confirmed: ["processing", "packed", "cancelled"],
  paid: ["processing", "packed", "refund_requested", "cancelled"],
  processing: ["packed", "refund_requested", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "return_requested"],
  delivered: ["completed", "return_requested"],
  completed: ["return_requested"],
  cancelled: [],
  refund_requested: ["refunded", "paid"],
  refunded: [],
  return_requested: ["returned", "completed"],
  returned: ["refunded"],
};

/** Order states in which items go back on the shelf. */
export const ORDER_RELEASES_ITEMS: OrderStatus[] = ["cancelled", "refunded"];

export const JOURNAL_KINDS = ["care", "photo_report", "problem", "question", "harvest", "note"] as const;
export type JournalKind = (typeof JOURNAL_KINDS)[number];

export const LIGHT_LEVELS = ["bright", "diffused", "low"] as const;
export type LightLevel = (typeof LIGHT_LEVELS)[number];

export const CARE_SECTIONS = ["description", "watering", "placement", "seasonal", "katya_tips", "kitchen"] as const;
export type CareSection = (typeof CARE_SECTIONS)[number];

export const CARE_TASKS = ["water", "feed", "prune", "rotate", "photo"] as const;
export type CareTask = (typeof CARE_TASKS)[number];

export const QUESTION_STATUSES = ["open", "answered", "closed"] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const REMINDER_STATUSES = ["pending", "sent", "done", "snoozed", "skipped"] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export function canTransition<S extends string>(table: Record<S, S[]>, from: S, to: S): boolean {
  return table[from]?.includes(to) ?? false;
}

/** Public display id, numbered per kind: baskets "САД · 001", singles "РОСЛИНА · 001" (en: GARDEN / PLANT). */
export function displayId(kind: ItemKind, no: number, locale: "uk" | "en" = "uk"): string {
  const word = kind === "basket" ? (locale === "uk" ? "САД" : "GARDEN") : locale === "uk" ? "РОСЛИНА" : "PLANT";
  return `${word} · ${String(no).padStart(3, "0")}`;
}

const NAME_IDEAS: Record<"uk" | "en", { basket: string[]; single: string[] }> = {
  uk: { basket: ["Мій кухонний сад", "Ароматний куточок", "Зелений сніданок", "Пряна гавань", "Сад на підвіконні"], single: ["Зелений друг", "Мій аромат", "Кущик-красень", "Пахуча дружба"] },
  en: { basket: ["My kitchen garden", "Fragrant corner", "Green breakfast", "Spice harbour", "Windowsill garden"], single: ["Green buddy", "My aroma", "Little beauty", "Fragrant friend"] },
};

/** Gentle suggestions for the "name your garden" field; `themes` can add ideas like the set name ("для чаю"). */
export function suggestGardenNames(kind: ItemKind, locale: "uk" | "en", themes: string[] = [], count = 4): string[] {
  const own = themes.map((t) => t.trim()).filter(Boolean);
  return [...own, ...NAME_IDEAS[locale][kind]].slice(0, count);
}
