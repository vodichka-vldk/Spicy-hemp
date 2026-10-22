import { NextResponse } from "next/server";
import { loadPublicProducts } from "@/lib/catalog-server";
import { buildOrder, providerReady, validateOrder } from "@/lib/orders";
import { registerNewOrder } from "@/lib/order-flow";
import { createStripeSession, siteUrl } from "@/lib/payments";
import { LIMITS, clientIp, hit, tooMany } from "@/lib/ratelimit";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = hit(`order:${clientIp(req)}`, LIMITS.order);
  if (!gate.ok) return tooMany(gate.retryAfterSec);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const catalog = await loadPublicProducts(); // only published products can be ordered
  const v = validateOrder(json, catalog);
  if (!v.ok) return NextResponse.json({ error: "validation", errors: v.errors }, { status: 422 });

  const order = buildOrder(v.value, new Date(), catalog);
  await registerNewOrder(store(), order);

  let redirect = `${siteUrl()}/${order.locale}/order/${order.id}`;
  try {
    if (order.payment === "stripe" && providerReady("stripe")) redirect = await createStripeSession(order);
    if (order.payment === "liqpay" && providerReady("liqpay")) redirect = `${siteUrl()}/api/pay/liqpay/${order.id}`;
  } catch (err) {
    console.error("payment init failed", err);
    return NextResponse.json({ error: "payment_init", orderId: order.id }, { status: 502 });
  }
  return NextResponse.json({ orderId: order.id, redirect });
}
