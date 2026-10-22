import { randomInt } from "node:crypto";
import { glazes, getProduct, computeTotals, currencyFor, priceMinor, productTitle, products as builtIn, type CartLine, type Glaze, type Product } from "./shop";
import { ALPHABET } from "./pots";
import type { Locale } from "./types";
import type { Order, PaymentMethod } from "./store/types";

export type OrderInput = {
  locale: Locale;
  lines: CartLine[];
  customer: { name: string; email: string; phone: string };
  shipping: { kind: "np" | "intl"; country: string; city: string; address: string; postcode?: string; cityRef?: string; warehouseRef?: string };
  gift?: { isGift: boolean; message?: string };
  note?: string;
  payment: PaymentMethod;
  agree: boolean;
};

export type FieldErrors = Record<string, "required" | "invalid_email" | "invalid_phone" | "invalid">;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits;
}

export function isPhone(raw: string): boolean {
  const d = normalisePhone(raw).replace(/\D/g, "");
  return d.length >= 9 && d.length <= 15;
}

export function paymentMethodsFor(opts: { shippingKind: "np" | "intl"; currency: "UAH" | "EUR" }): PaymentMethod[] {
  const out: PaymentMethod[] = [];
  if (opts.shippingKind === "np") out.push("cod");
  // card prepayment is always offered; without provider keys the order waits for a payment link (see providerReady)
  out.push(opts.currency === "EUR" ? "stripe" : "liqpay");
  return out;
}

/** True when the payment provider's keys are set, i.e. the "Pay now" flow can start automatically. */
export function providerReady(method: PaymentMethod): boolean {
  if (method === "stripe") return !!process.env.STRIPE_SECRET_KEY;
  if (method === "liqpay") return !!(process.env.LIQPAY_PUBLIC_KEY && process.env.LIQPAY_PRIVATE_KEY);
  return false;
}

export function validateOrder(input: unknown, catalog: Product[] = builtIn): { ok: true; value: OrderInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const i = (input ?? {}) as Partial<OrderInput>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const locale: Locale = i.locale === "en" ? "en" : "uk";
  const lines: CartLine[] = Array.isArray(i.lines)
    ? i.lines.flatMap((l) => {
        const p = l && typeof l.slug === "string" ? getProduct(l.slug, catalog) : undefined;
        const qty = Number(l?.qty);
        if (!p || !Number.isInteger(qty) || qty < 1 || qty > 20) return [];
        const glaze = (glazes as readonly string[]).includes(l.glaze) ? (l.glaze as Glaze) : "sage";
        return [{ slug: p.slug, glaze, qty }];
      })
    : [];
  if (lines.length === 0) errors.lines = "required";

  const name = str(i.customer?.name);
  const email = str(i.customer?.email);
  const phone = str(i.customer?.phone);
  if (name.length < 2) errors.name = "required";
  if (!email) errors.email = "required"; else if (!EMAIL.test(email)) errors.email = "invalid_email";
  if (!phone) errors.phone = "required"; else if (!isPhone(phone)) errors.phone = "invalid_phone";

  const kind = i.shipping?.kind === "intl" ? "intl" : "np";
  const country = str(i.shipping?.country) || (kind === "np" ? "UA" : "");
  const city = str(i.shipping?.city);
  const address = str(i.shipping?.address);
  const postcode = str(i.shipping?.postcode);
  if (!city) errors.city = "required";
  if (!address) errors.address = "required";
  if (kind === "intl" && !country) errors.country = "required";
  if (kind === "intl" && !postcode) errors.postcode = "required";

  const currency = currencyFor(locale);
  const allowed = paymentMethodsFor({ shippingKind: kind, currency });
  if (!i.payment || !allowed.includes(i.payment)) errors.payment = "invalid";
  if (i.agree !== true) errors.agree = "required";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      locale,
      lines,
      customer: { name, email, phone: normalisePhone(phone) },
      shipping: {
        kind, country, city, address, postcode: postcode || undefined,
        ...(kind === "np" && isRef(i.shipping?.cityRef) && isRef(i.shipping?.warehouseRef) ? { cityRef: i.shipping.cityRef, warehouseRef: i.shipping.warehouseRef } : {}),
      },
      gift: { isGift: Boolean(i.gift?.isGift), message: str(i.gift?.message).slice(0, 300) || undefined },
      note: str(i.note).slice(0, 500) || undefined,
      payment: i.payment as PaymentMethod,
      agree: true,
    },
  };
}

/** Nova Poshta refs are GUIDs. */
export const isRef = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);

export function newOrderId(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  let tail = "";
  for (let k = 0; k < 8; k++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `SH-${d}-${tail}`;
}

/** Builds the order on the server from product slugs only: client prices are never trusted. */
export function buildOrder(input: OrderInput, now = new Date(), catalog: Product[] = builtIn): Order {
  const currency = currencyFor(input.locale);
  const totals = computeTotals(input.lines, currency, input.shipping.kind, catalog);
  return {
    id: newOrderId(now),
    createdAt: now.toISOString(),
    status: input.payment === "cod" ? "new" : "pending_payment",
    locale: input.locale,
    currency,
    items: input.lines.map((l) => {
      const p = getProduct(l.slug, catalog)!;
      return { slug: l.slug, glaze: l.glaze, qty: l.qty, unitMinor: priceMinor(p.priceUah, currency), title: productTitle(p, input.locale) };
    }),
    subtotalMinor: totals.subtotal,
    shippingMinor: totals.shipping,
    totalMinor: totals.total,
    payment: input.payment,
    customer: input.customer,
    shipping: input.shipping,
    gift: input.gift ?? { isGift: false },
    note: input.note,
    potCodes: [],
  };
}
