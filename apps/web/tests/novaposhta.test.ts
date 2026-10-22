import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NovaPoshtaError, createWaybill, listWarehouses, searchCities, splitName, trackWaybill } from "@/lib/novaposhta";
import type { Order } from "@/lib/store/types";

type Call = { modelName: string; calledMethod: string; methodProperties: Record<string, unknown> };
let calls: Call[];
const reply = (data: unknown[], success = true) => ({ ok: true, json: async () => ({ success, data, errors: success ? [] : ["Bad request"] }) });

function mockApi(responses: unknown[][]) {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: { body: string }) => {
    calls.push(JSON.parse(init.body));
    return reply(responses[calls.length - 1] ?? []);
  }));
}

beforeEach(() => {
  process.env.NOVA_POSHTA_API_KEY = "key";
  Object.assign(process.env, { NP_SENDER_CITY_REF: "c1", NP_SENDER_REF: "s1", NP_SENDER_ADDRESS_REF: "a1", NP_SENDER_CONTACT_REF: "k1", NP_SENDER_PHONE: "380501112233" });
});
afterEach(() => { vi.unstubAllGlobals(); for (const k of ["NOVA_POSHTA_API_KEY", "NP_SENDER_CITY_REF", "NP_SENDER_REF", "NP_SENDER_ADDRESS_REF", "NP_SENDER_CONTACT_REF", "NP_SENDER_PHONE"]) delete process.env[k]; });

const order = (over: Partial<Order> = {}): Order => ({
  id: "SH-1", createdAt: "2026-10-22T10:00:00Z", status: "packed", locale: "uk", currency: "UAH", items: [], subtotalMinor: 219000, shippingMinor: 0, totalMinor: 219000,
  payment: "cod", customer: { name: "Шевченко Олена Петрівна", email: "o@example.com", phone: "+380501234567" },
  shipping: { kind: "np", country: "UA", city: "Київ", address: "Відділення 12", cityRef: "city-ref", warehouseRef: "wh-ref" }, gift: { isGift: false }, potCodes: [], ...over,
});

describe("Nova Poshta client", () => {
  it("splits Ukrainian full names", () => {
    expect(splitName("Шевченко Олена Петрівна")).toEqual({ last: "Шевченко", first: "Олена", middle: "Петрівна" });
    expect(splitName("Олена Шевченко")).toEqual({ first: "Олена", last: "Шевченко", middle: "" });
    expect(splitName("Олена")).toEqual({ first: "Олена", last: "Олена", middle: "" });
  });

  it("maps city and warehouse search results", async () => {
    mockApi([[{ Addresses: [{ DeliveryCity: "r1", MainDescription: "Київ", Area: "Київська" }, { DeliveryCity: "", MainDescription: "Skip", Area: "" }] }], [{ Ref: "w1", Description: "Відділення №1", Number: "1" }]]);
    expect(await searchCities("Ки")).toEqual([{ ref: "r1", name: "Київ", area: "Київська" }]);
    expect(await listWarehouses("r1")).toEqual([{ ref: "w1", name: "Відділення №1", number: "1" }]);
    expect(calls[0]).toMatchObject({ modelName: "Address", calledMethod: "searchSettlements" });
    expect(calls[1]).toMatchObject({ modelName: "AddressGeneral", calledMethod: "getWarehouses", methodProperties: { CityRef: "r1" } });
    expect(await searchCities("К")).toEqual([]);
  });

  it("creates the recipient and a cash-on-delivery waybill", async () => {
    mockApi([[{ Ref: "cp1", ContactPerson: { data: [{ Ref: "contact1" }] } }], [{ Ref: "doc1", IntDocNumber: "20450000111222" }]]);
    const r = await createWaybill(order(), new Date(2026, 9, 22));
    expect(r).toEqual({ ttn: "20450000111222", ref: "doc1" });
    expect(calls.map((c) => `${c.modelName}.${c.calledMethod}`)).toEqual(["Counterparty.save", "InternetDocument.save"]);
    expect(calls[0].methodProperties).toMatchObject({ LastName: "Шевченко", FirstName: "Олена", MiddleName: "Петрівна", CounterpartyProperty: "Recipient" });
    expect(calls[1].methodProperties).toMatchObject({
      CitySender: "c1", CityRecipient: "city-ref", RecipientAddress: "wh-ref", Recipient: "cp1", ContactRecipient: "contact1",
      ServiceType: "WarehouseWarehouse", Cost: "2190", DateTime: "22.10.2026",
      BackwardDeliveryData: [{ PayerType: "Recipient", CargoType: "Money", RedeliveryString: "2190" }],
    });
  });

  it("does not add the money transfer for prepaid orders", async () => {
    mockApi([[{ Ref: "cp1", ContactPerson: { data: [{ Ref: "contact1" }] } }], [{ Ref: "doc1", IntDocNumber: "1" }]]);
    await createWaybill(order({ payment: "stripe" }));
    expect(calls[1].methodProperties.BackwardDeliveryData).toBeUndefined();
  });

  it("explains what is missing instead of calling the API", async () => {
    mockApi([]);
    await expect(createWaybill(order({ shipping: { kind: "np", country: "UA", city: "Київ", address: "x" } }))).rejects.toThrow(/city\/warehouse/);
    await expect(createWaybill(order({ shipping: { kind: "intl", country: "DE", city: "Berlin", address: "x" } }))).rejects.toThrow(NovaPoshtaError);
    delete process.env.NP_SENDER_PHONE;
    await expect(createWaybill(order())).rejects.toThrow(/NP_SENDER_PHONE/);
    expect(calls).toHaveLength(0);
  });

  it("surfaces API errors and tracks delivery", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply([], false)));
    await expect(searchCities("Київ")).rejects.toThrow(/Bad request/);
    mockApi([[{ StatusCode: "9", Status: "Відправлення отримано" }]]);
    expect(await trackWaybill("2045", "380501234567")).toEqual({ statusCode: "9", status: "Відправлення отримано", delivered: true });
    mockApi([[{ StatusCode: "4", Status: "У дорозі" }]]);
    expect((await trackWaybill("2045", "380501234567"))?.delivered).toBe(false);
  });
});
