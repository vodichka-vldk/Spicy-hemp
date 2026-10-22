import type { OrderStatus } from "./domain";
import type { Order } from "./store/types";

export const ORDER_TABS = [
  { key: "todo", label: "Потребують дії", statuses: ["new", "cod_confirmed", "paid", "processing", "packed", "refund_requested", "return_requested"] },
  { key: "unpaid", label: "Очікують оплату", statuses: ["pending_payment", "payment_failed"] },
  { key: "shipped", label: "В дорозі", statuses: ["shipped"] },
  { key: "done", label: "Завершені", statuses: ["delivered", "completed"] },
  { key: "closed", label: "Скасовані й повернені", statuses: ["cancelled", "refunded", "returned"] },
  { key: "all", label: "Усі", statuses: [] },
] as const satisfies ReadonlyArray<{ key: string; label: string; statuses: readonly OrderStatus[] }>;

export type OrderTab = (typeof ORDER_TABS)[number]["key"];

export function inTab(order: Pick<Order, "status">, tab: OrderTab): boolean {
  const t = ORDER_TABS.find((x) => x.key === tab);
  if (!t || t.key === "all") return true;
  return (t.statuses as readonly string[]).includes(order.status);
}

/** Free-text search over id, customer name, phone, e-mail and waybill. */
export function matchesQuery(order: Order, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return [order.id, order.customer.name, order.customer.email, order.shipment?.ttn ?? ""].some((v) => v.toLowerCase().includes(q))
    || (digits.length >= 4 && order.customer.phone.replace(/\D/g, "").includes(digits));
}

/** What the packer should do next, in plain words. */
export function nextAction(o: Pick<Order, "status" | "payment" | "shipment">): string {
  switch (o.status) {
    case "new": return o.payment === "cod" ? "Зателефонувати й підтвердити замовлення" : "Чекаємо оплату";
    case "pending_payment": return "Чекаємо оплату від клієнта";
    case "payment_failed": return "Оплата не пройшла: клієнт може повторити";
    case "cod_confirmed": case "paid": return "Прийняти в роботу й зібрати";
    case "processing": return "Зібрати й упакувати";
    case "packed": return "Створити ТТН і відправити";
    case "shipped": return o.shipment ? "Чекаємо доставку (оновіть статус посилки)" : "Додайте ТТН";
    case "delivered": return "Позначити виконаним після підтвердження";
    case "refund_requested": return "Повернути кошти й оновити статус";
    case "return_requested": return "Прийняти повернення або відхилити";
    default: return "";
  }
}
