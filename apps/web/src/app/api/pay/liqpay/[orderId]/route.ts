import { NextResponse } from "next/server";
import { liqpayForm } from "@/lib/payments";
import { changeOrderStatus } from "@/lib/order-flow";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await ctx.params;
  const db = store();
  let order = await db.getOrder(orderId);
  // a failed payment can be retried: back to "awaiting payment"
  if (order?.status === "payment_failed") {
    const r = await changeOrderStatus(db, orderId, "pending_payment", { type: "customer" }, "Повторна спроба оплати");
    if (r.ok) order = r.order;
  }
  if (!order || order.payment !== "liqpay" || order.status !== "pending_payment" || !process.env.LIQPAY_PRIVATE_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }
  const { data, signature } = liqpayForm(order);
  const html = `<!doctype html><meta charset="utf-8"><title>LiqPay</title>
<form id="f" method="POST" action="https://www.liqpay.ua/api/3/checkout" accept-charset="utf-8">
<input type="hidden" name="data" value="${data}"><input type="hidden" name="signature" value="${signature}">
<noscript><button type="submit">Pay</button></noscript></form><script>document.getElementById("f").submit()</script>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
