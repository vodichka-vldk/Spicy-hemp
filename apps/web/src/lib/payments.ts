import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "./store/types";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
export const qrBaseUrl = () => (process.env.NEXT_PUBLIC_QR_BASE_URL || siteUrl()).replace(/\/$/, "");

// ---------- Stripe (plain REST, no SDK) ----------
export async function createStripeSession(order: Order): Promise<string> {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("client_reference_id", order.id);
  body.set("customer_email", order.customer.email);
  body.set("success_url", `${siteUrl()}/${order.locale}/order/${order.id}?paid=1`);
  body.set("cancel_url", `${siteUrl()}/${order.locale}/order/${order.id}`);
  body.set("metadata[order_id]", order.id);
  const lines = [...order.items.map((i) => ({ name: i.title, unit: i.unitMinor, qty: i.qty }))];
  if (order.shippingMinor > 0) lines.push({ name: "Shipping", unit: order.shippingMinor, qty: 1 });
  lines.forEach((l, idx) => {
    body.set(`line_items[${idx}][quantity]`, String(l.qty));
    body.set(`line_items[${idx}][price_data][currency]`, order.currency.toLowerCase());
    body.set(`line_items[${idx}][price_data][unit_amount]`, String(l.unit));
    body.set(`line_items[${idx}][price_data][product_data][name]`, l.name);
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { url: string };
  return json.url;
}

/** Verifies a Stripe webhook signature header (t=...,v1=...) with 5 minute tolerance. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(nowSec - t) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const given = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return given.some((g) => g.length === expected.length && timingSafeEqual(Buffer.from(g), Buffer.from(expected)));
}

// ---------- LiqPay ----------
export function liqpaySign(data: string, privateKey: string): string {
  return createHash("sha1").update(privateKey + data + privateKey).digest("base64");
}

export function liqpayForm(order: Order): { data: string; signature: string } {
  const payload = {
    version: 3,
    public_key: process.env.LIQPAY_PUBLIC_KEY,
    action: "pay",
    amount: order.totalMinor / 100,
    currency: order.currency,
    description: `Order ${order.id}`,
    order_id: order.id,
    result_url: `${siteUrl()}/${order.locale}/order/${order.id}?paid=1`,
    server_url: `${siteUrl()}/api/webhooks/liqpay`,
    language: order.locale,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  return { data, signature: liqpaySign(data, process.env.LIQPAY_PRIVATE_KEY!) };
}

export function verifyLiqpay(data: string, signature: string, privateKey: string): boolean {
  const expected = liqpaySign(data, privateKey);
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
