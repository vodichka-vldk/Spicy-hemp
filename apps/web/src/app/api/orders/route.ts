import { NextResponse } from "next/server";
import { buildOrder, providerReady, validateOrder } from "@/lib/orders";
import { registerNewOrder } from "@/lib/order-flow";
import { createStripeSession, siteUrl } from "@/lib/payments";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const v = validateOrder(json);
  if (!v.ok) return NextResponse.json({ error: "validation", errors: v.errors }, { status: 422 });

  const order = buildOrder(v.value);
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
