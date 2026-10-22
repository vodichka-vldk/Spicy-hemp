import { NextResponse } from "next/server";
import { verifyLiqpay } from "@/lib/payments";
import { changeOrderStatus, confirmPayment } from "@/lib/order-flow";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  if (!priv) return new NextResponse("not configured", { status: 503 });
  const form = await req.formData();
  const data = String(form.get("data") ?? "");
  const signature = String(form.get("signature") ?? "");
  if (!data || !verifyLiqpay(data, signature, priv)) return new NextResponse("bad signature", { status: 400 });
  const body = JSON.parse(Buffer.from(data, "base64").toString("utf8")) as { status: string; order_id: string };
  if (body.status === "success" || body.status === "sandbox") await confirmPayment(store(), body.order_id);
  if (body.status === "failure" || body.status === "error") await changeOrderStatus(store(), body.order_id, "payment_failed", { type: "webhook" });
  return NextResponse.json({ received: true });
}
