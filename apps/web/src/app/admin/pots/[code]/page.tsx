import Link from "next/link";
import { notFound } from "next/navigation";
import { loadProducts } from "@/lib/catalog-server";
import { getHerb } from "@/lib/content";
import { displayId, ITEM_TRANSITIONS } from "@/lib/domain";
import { dict } from "@/lib/i18n";
import { hintFor } from "@/lib/questions";
import { cleanCode, formatCode, isValidCode } from "@/lib/pots";
import { getProduct, productTitle } from "@/lib/shop";
import { store } from "@/lib/store";
import { saveItemNote, setItemStatus } from "../../actions";

export const dynamic = "force-dynamic";

const statusUk = (s: string) => (dict as Record<string, { uk: string }>)[`item_status_${s}`]?.uk ?? s;
const TASK_UK: Record<string, string> = { water: "полив", feed: "підживлення", photo: "фото-звіт", rotate: "повернути горщик", prune: "обрізати", review: "запит відгуку" };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" }) : "—");

/** Everything about one physical pot: who owns it, what is planned, what they asked, how it was rated. */
export default async function PotCard({ params }: { params: Promise<{ code: string }> }) {
  const code = cleanCode((await params).code);
  if (!isValidCode(code)) notFound();
  const db = store();
  const item = await db.getItem(code);
  if (!item) notFound();
  const [catalog, owners, reminders, questions, reviews, note] = await Promise.all([
    loadProducts(), db.listOwners(), db.listReminders({ itemCode: code }), db.listQuestions({ itemCode: code }), db.listReviews(), db.getSetting<string>(`item_note:${code}`),
  ]);
  const product = getProduct(item.product, catalog);
  const owner = owners.find((o) => o.id === item.ownerId);
  const review = reviews.find((r) => r.itemCode === code);
  const upcoming = reminders.filter((r) => r.status === "pending" || r.status === "snoozed" || r.status === "sent").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const next = ITEM_TRANSITIONS[item.status];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/pots" className="text-sm text-muted">← Горщики й QR</Link>
        <h1 className="text-3xl font-bold">{displayId(item.kind, item.displayNo, "uk")}{item.ownerName ? ` «${item.ownerName}»` : ""}</h1>
        <span className="badge">{statusUk(item.status)}</span>
      </div>

      <section className="card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <p><span className="text-muted">Товар:</span> {product ? <Link href={`/admin/catalog/${product.slug}`}>{productTitle(product, "uk")}</Link> : item.product || "—"}</p>
        <p><span className="text-muted">Склад:</span> {item.species.map((s) => getHerb(s)?.names.uk ?? s).join(", ")}</p>
        <p><span className="text-muted">Код:</span> <span className="font-mono">{formatCode(code)}</span> · <a href={`/p/${code}`} className="text-leaf underline">/p/{code}</a></p>
        <p><span className="text-muted">Партія:</span> {item.batch} · готовий {item.readyOn}</p>
        <p><span className="text-muted">Замовлення:</span> {item.orderId ? <Link href={`/admin/orders/${item.orderId}`} className="font-mono">{item.orderId}</Link> : "—"}</p>
        <p><span className="text-muted">Власник:</span> {owner ? `${owner.firstName ?? "—"}${owner.username ? ` @${owner.username}` : ""}, активовано ${when(item.activatedAt)}` : "ще не активовано"}</p>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-xl font-bold">Статус і повернення</h2>
        {next.length === 0 ? <p className="text-sm text-muted">З цього статусу переходів немає.</p> : (
          <form action={setItemStatus} className="space-y-2">
            <input type="hidden" name="code" value={code} />
            <textarea name="note" rows={2} className="input" maxLength={500} placeholder="Причина, наприклад «повернення: рослина не прижилась»" aria-label="Причина" defaultValue={note ?? ""} />
            <div className="flex flex-wrap gap-2">
              {next.map((to) => (<button key={to} name="to" value={to} className="btn btn-ghost" type="submit">→ {statusUk(to)}</button>))}
            </div>
            <p className="text-xs text-muted">«На складі» знімає власника й замовлення з горщика: так робимо після повернення, коли рослина придатна для продажу.</p>
          </form>
        )}
        <form action={saveItemNote} className="mt-3 flex gap-2">
          <input type="hidden" name="code" value={code} />
          <input name="note" className="input" defaultValue={note ?? ""} maxLength={500} placeholder="Нотатка про горщик" aria-label="Нотатка" />
          <button className="btn btn-ghost" type="submit">Зберегти</button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-xl font-bold">Питання власника ({questions.length})</h2>
        {questions.length === 0 ? <p className="text-sm text-muted">Питань не було.</p> : (
          <ul className="space-y-2 text-sm">{questions.map((q) => (
            <li key={q.id} className="rounded-lg bg-soft p-3">
              <p className="text-muted">{when(q.createdAt)}{q.symptom ? ` · ${hintFor(q.symptom, "uk")?.symptom}` : ""}</p>
              <p>{q.body}</p>
              {q.answer ? <p className="mt-1 font-semibold text-leaf">Відповідь: {q.answer}</p> : <Link href="/admin/questions" className="text-clay underline">Чекає відповіді →</Link>}
            </li>))}</ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-xl font-bold">Відгук</h2>
        {review ? <p className="text-sm"><span className="text-amber-600">{"★".repeat(review.rating)}</span> · {review.status === "approved" ? "схвалено" : review.status === "rejected" ? "відхилено" : "на модерації"} · {review.consentPublic ? "згода є" : "без згоди на публікацію"}{review.body ? ` · «${review.body}»` : ""} <Link href="/admin/reviews" className="text-leaf underline">до відгуків →</Link></p> : <p className="text-sm text-muted">Оцінки ще немає.</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-xl font-bold">Заплановані нагадування</h2>
        {upcoming.length === 0 ? <p className="text-sm text-muted">Нагадувань немає (з'являться після активації).</p> : (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">{upcoming.map((r) => (
            <li key={r.id}>{when(r.dueAt)} · {TASK_UK[r.task] ?? r.task}{r.species ? ` (${getHerb(r.species)?.names.uk ?? r.species})` : ""}{r.status === "sent" ? " · надіслано" : r.status === "snoozed" ? " · відкладено" : ""}</li>))}</ul>
        )}
      </section>

      <section className="card p-5 text-sm text-muted">
        <h2 className="mb-1 text-xl font-bold text-ink">Журнал догляду</h2>
        Записи журналу й фото з'являться, коли буде зроблено журнал у Mini App (етап 5.3). Тоді тут з'являться записи, фільтр «проблеми» і фото для претензій.
      </section>
    </div>
  );
}
