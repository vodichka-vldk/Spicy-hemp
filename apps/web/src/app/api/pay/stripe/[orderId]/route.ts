import { NextResponse } from "next/server";
import { changeOrderStatus } from "@/lib/order-flow";
import { createStripeSession, siteUrl } from "@/lib/payments";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** "Pay now" from the order page: a fresh Stripe Checkout session for an unpaid order. */
export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const db = store();
  let order = await db.getOrder(orderId);
  if (order?.status === "payment_failed") {
    const r = await changeOrderStatus(db, orderId, "pending_payment", { type: "customer" }, "Повторна спроба оплати");
    if (r.ok) order = r.order;
  }
  if (!order || order.payment !== "stripe" || order.status !== "pending_payment") return new NextResponse("Not found", { status: 404 });
  try {
    return NextResponse.redirect(await createStripeSession(order), 303);
  } catch (err) {
    console.error("stripe session failed", err);
    return NextResponse.redirect(`${siteUrl()}/${order.locale}/order/${order.id}?pay=failed`, 303);
  }
}
