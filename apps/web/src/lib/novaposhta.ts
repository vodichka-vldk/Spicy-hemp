import type { Order } from "./store/types";

/**
 * Nova Poshta API 2.0 client (cities, warehouses, waybill, tracking).
 * Needs NOVA_POSHTA_API_KEY; creating waybills also needs the NP_SENDER_* values (see docs/INTEGRATIONS.md).
 * NOT yet exercised against the live API: requests are covered by tests with a mocked fetch.
 */
const ENDPOINT = "https://api.novaposhta.ua/v2.0/json/";

export class NovaPoshtaError extends Error {}

type NpResponse<T> = { success: boolean; data: T[]; errors?: string[]; errorCodes?: string[] };

export const novaPoshtaConfigured = () => Boolean(process.env.NOVA_POSHTA_API_KEY);

async function call<T>(modelName: string, calledMethod: string, methodProperties: Record<string, unknown>): Promise<T[]> {
  const apiKey = process.env.NOVA_POSHTA_API_KEY;
  if (!apiKey) throw new NovaPoshtaError("NOVA_POSHTA_API_KEY is not set");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
    cache: "no-store",
  });
  if (!res.ok) throw new NovaPoshtaError(`Nova Poshta HTTP ${res.status}`);
  const json = (await res.json()) as NpResponse<T>;
  if (!json.success) throw new NovaPoshtaError(json.errors?.join("; ") || "Nova Poshta request failed");
  return json.data;
}

export type City = { ref: string; name: string; area: string };
export type Warehouse = { ref: string; name: string; number: string };

export async function searchCities(query: string): Promise<City[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await call<{ Addresses: Array<{ DeliveryCity: string; MainDescription: string; Area: string }> }>("Address", "searchSettlements", { CityName: q, Limit: "10", Page: "1" });
  return (data[0]?.Addresses ?? []).filter((a) => a.DeliveryCity).map((a) => ({ ref: a.DeliveryCity, name: a.MainDescription, area: a.Area }));
}

export async function listWarehouses(cityRef: string, search = ""): Promise<Warehouse[]> {
  const data = await call<{ Ref: string; Description: string; Number: string }>("AddressGeneral", "getWarehouses", { CityRef: cityRef, FindByString: search, Limit: "50", Page: "1", Language: "UA" });
  return data.map((w) => ({ ref: w.Ref, name: w.Description, number: w.Number }));
}

/** Ukrainian full names come as "Прізвище Ім'я По батькові" or "Ім'я Прізвище". */
export function splitName(full: string): { first: string; last: string; middle: string } {
  const p = full.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 3) return { last: p[0], first: p[1], middle: p.slice(2).join(" ") };
  if (p.length === 2) return { first: p[0], last: p[1], middle: "" };
  return { first: p[0] ?? "", last: p[0] ?? "", middle: "" };
}

const sender = () => {
  const keys = ["NP_SENDER_CITY_REF", "NP_SENDER_REF", "NP_SENDER_ADDRESS_REF", "NP_SENDER_CONTACT_REF", "NP_SENDER_PHONE"] as const;
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) throw new NovaPoshtaError(`Missing ${missing.join(", ")}`);
  return {
    CitySender: process.env.NP_SENDER_CITY_REF!, Sender: process.env.NP_SENDER_REF!, SenderAddress: process.env.NP_SENDER_ADDRESS_REF!,
    ContactSender: process.env.NP_SENDER_CONTACT_REF!, SendersPhone: process.env.NP_SENDER_PHONE!,
  };
};

const ddmmyyyy = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

/** Creates the recipient and the waybill (TTN). Cash on delivery adds the money-transfer service for the order total. */
export async function createWaybill(order: Order, now = new Date()): Promise<{ ttn: string; ref: string }> {
  if (order.shipping.kind !== "np") throw new NovaPoshtaError("Nova Poshta waybills are for domestic orders only");
  const { cityRef, warehouseRef } = order.shipping;
  if (!cityRef || !warehouseRef) throw new NovaPoshtaError("The order has no Nova Poshta city/warehouse selected");
  const s = sender();
  const n = splitName(order.customer.name);
  const [cp] = await call<{ Ref: string; ContactPerson: { data: Array<{ Ref: string }> } }>("Counterparty", "save", {
    FirstName: n.first, MiddleName: n.middle, LastName: n.last, Phone: order.customer.phone, Email: order.customer.email,
    CounterpartyType: "PrivatePerson", CounterpartyProperty: "Recipient",
  });
  const contact = cp?.ContactPerson?.data?.[0]?.Ref;
  if (!cp?.Ref || !contact) throw new NovaPoshtaError("Nova Poshta did not return the recipient");
  const cod = order.payment === "cod";
  const cost = Math.max(1, Math.round(order.subtotalMinor / 100));
  const [doc] = await call<{ Ref: string; IntDocNumber: string }>("InternetDocument", "save", {
    ...s,
    PayerType: "Recipient", PaymentMethod: "Cash", CargoType: "Cargo", ServiceType: "WarehouseWarehouse",
    SeatsAmount: "1", Weight: "1.5", VolumeGeneral: "0.01", Description: "Живі рослини в горщику",
    Cost: String(cost), DateTime: ddmmyyyy(now),
    CityRecipient: cityRef, RecipientAddress: warehouseRef, Recipient: cp.Ref, ContactRecipient: contact, RecipientsPhone: order.customer.phone,
    ...(cod ? { BackwardDeliveryData: [{ PayerType: "Recipient", CargoType: "Money", RedeliveryString: String(Math.round(order.totalMinor / 100)) }] } : {}),
  });
  if (!doc?.IntDocNumber) throw new NovaPoshtaError("Nova Poshta did not return the waybill number");
  return { ttn: doc.IntDocNumber, ref: doc.Ref };
}

export type Tracking = { statusCode: string; status: string; delivered: boolean };

export async function trackWaybill(ttn: string, phone: string): Promise<Tracking | null> {
  const [d] = await call<{ StatusCode: string; Status: string }>("TrackingDocument", "getStatusDocuments", { Documents: [{ DocumentNumber: ttn, Phone: phone }] });
  if (!d) return null;
  return { statusCode: d.StatusCode, status: d.Status, delivered: ["9", "10", "11"].includes(String(d.StatusCode)) };
}
