import { store } from "@/lib/store";
import { moderateReview } from "../actions";

export const dynamic = "force-dynamic";

export default async function Reviews() {
  const reviews = await store().listReviews();
  const pending = reviews.filter((r) => r.status === "pending");
  const rest = reviews.filter((r) => r.status !== "pending");
  const Row = ({ r }: { r: (typeof reviews)[number] }) => (
    <li className="card p-4 text-sm">
      <p className="flex flex-wrap items-center gap-2"><span className="text-amber-600">{"★".repeat(r.rating)}</span><span className="badge">{({ pending: "очікує", approved: "схвалено", rejected: "відхилено" } as const)[r.status]}</span><span className="font-mono">{r.product}</span>{r.itemCode && <span className="font-mono text-muted">{r.itemCode}</span>}</p>
      {r.body && <p className="mt-2">{r.body}</p>}
      <p className="mt-1 text-muted">{r.authorName ?? "—"} · {r.createdAt.slice(0, 10)} · {r.photos.length} фото · {r.consentPublic ? "згода на публікацію ✓" : "немає згоди: публікувати не можна"}</p>
      {r.status !== "approved" && (
        <form action={moderateReview} className="mt-3 flex gap-2">
          <input type="hidden" name="id" value={r.id} />
          <button name="status" value="approved" disabled={!r.consentPublic} className="btn btn-primary">Схвалити</button>
          <button name="status" value="rejected" className="btn btn-ghost">Відхилити</button>
        </form>
      )}
    </li>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Відгуки</h1>
      <p className="text-sm text-muted">Відгуки й фото потрапляють на сторінку товару лише за згодою власника та після вашого схвалення.</p>
      <section><h2 className="mb-2 text-xl font-bold">На модерації ({pending.length})</h2><ul className="space-y-3">{pending.map((r) => <Row key={r.id} r={r} />)}</ul>{pending.length === 0 && <p className="text-muted">Нічого не чекає.</p>}</section>
      <section><h2 className="mb-2 text-xl font-bold">Опрацьовані</h2><ul className="space-y-3">{rest.map((r) => <Row key={r.id} r={r} />)}</ul></section>
    </div>
  );
}
