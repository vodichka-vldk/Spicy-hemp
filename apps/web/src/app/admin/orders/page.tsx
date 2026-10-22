import Link from "next/link";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Orders() {
  const orders = await store().listOrders();
  return (
    <div>
      <h1 className="mb-4 text-3xl font-bold">Orders</h1>
      {orders.length === 0 ? <p className="text-muted">No orders yet.</p> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted"><tr><th className="p-3">Order</th><th>Date</th><th>Customer</th><th>Status</th><th>Payment</th><th className="pr-3 text-right">Total</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold">{o.id}</Link></td>
                  <td>{o.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td>{o.customer.name}</td>
                  <td><span className="badge">{o.status}</span></td>
                  <td>{o.payment}</td>
                  <td className="pr-3 text-right font-semibold">{formatMoney(o.totalMinor, o.currency, "en")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
