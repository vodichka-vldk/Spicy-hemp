import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments";
import { confirmPayment } from "@/lib/order-flow";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("not configured", { status: 503 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return new NextResponse("bad signature", { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: { client_reference_id?: string; payment_status?: string; payment_intent?: string } } };
  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const id = event.data.object.client_reference_id;
    if (id) await confirmPayment(store(), id, event.data.object.payment_intent);
  }
  return NextResponse.json({ received: true });
}
