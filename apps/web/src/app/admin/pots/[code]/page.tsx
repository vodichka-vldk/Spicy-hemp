import Link from "next/link";
import { Alert, Badge, Button, Input, Rating, Timeline } from "@/ds";
import { Facts, PageHeader, Panel, StatusBadge } from "@/ui";
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
const JOURNAL_UK: Record<string, string> = { note: "Нотатка", care: "Догляд", photo_report: "Фото-звіт", problem: "Проблема", harvest: "Збір урожаю", question: "Питання" };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" }) : "—");

/** Everything about one physical pot: who owns it, what is planned, what they asked, how it was rated. */
export default async function PotCard({ params }: { params: Promise<{ code: string }> }) {
  const code = cleanCode((await params).code);
  if (!isValidCode(code)) notFound();
  const db = store();
  const item = await db.getItem(code);
  if (!item) notFound();
  const [catalog, owners, reminders, questions, reviews, note, journal] = await Promise.all([
    loadProducts(), db.listOwners(), db.listReminders({ itemCode: code }), db.listQuestions({ itemCode: code }), db.listReviews(), db.getSetting<string>(`item_note:${code}`), db.listJournal({ itemCode: code }),
  ]);
  const product = getProduct(item.product, catalog);
  const owner = owners.find((o) => o.id === item.ownerId);
  const review = reviews.find((r) => r.itemCode === code);
  const upcoming = reminders.filter((r) => r.status === "pending" || r.status === "snoozed" || r.status === "sent").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const next = ITEM_TRANSITIONS[item.status];
  return (
    <div className="sh-stack-lg">
      <PageHeader
        back={{ href: "/admin/pots", label: "Горщики й QR" }}
        title={`${displayId(item.kind, item.displayNo, "uk")}${item.ownerName ? ` «${item.ownerName}»` : ""}`}
        actions={<StatusBadge kind="item" status={item.status} label={statusUk(item.status)} />}
      />

      <Panel>
        <Facts items={[
          { label: "Товар", value: product ? <Link href={`/admin/catalog/${product.slug}`}>{productTitle(product, "uk")}</Link> : item.product || "—" },
          { label: "Склад", value: item.species.map((s) => getHerb(s)?.names.uk ?? s).join(", ") },
          { label: "Код", value: <><span className="font-mono">{formatCode(code)}</span> · <a href={`/p/${code}`} className="underline">/p/{code}</a></> },
          { label: "Партія", value: `${item.batch} · готовий ${item.readyOn}` },
          { label: "Замовлення", value: item.orderId ? <Link href={`/admin/orders/${item.orderId}`} className="font-mono">{item.orderId}</Link> : "—" },
          { label: "Власник", value: owner ? `${owner.firstName ?? "—"}${owner.username ? ` @${owner.username}` : ""}, активовано ${when(item.activatedAt)}` : "ще не активовано" },
        ]} />
      </Panel>

      <Panel title="Статус і повернення" lead="«На складі» знімає власника й замовлення з горщика: так робимо після повернення, коли рослина придатна для продажу.">
        {next.length === 0 ? <p className="sh-muted">З цього статусу переходів немає.</p> : (
          <form action={setItemStatus} className="sh-stack">
            <input type="hidden" name="code" value={code} />
            <Input multiline rows={2} name="note" maxLength={500} placeholder="Причина, наприклад «повернення: рослина не прижилась»" aria-label="Причина" defaultValue={note ?? ""} />
            <div className="flex flex-wrap gap-2">
              {next.map((to) => (<Button key={to} name="to" value={to} type="submit" variant="secondary" iconRight="arrow-right">{statusUk(to)}</Button>))}
            </div>
          </form>
        )}
        <form action={saveItemNote} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="code" value={code} />
          <div style={{ flex: "1 1 16rem" }}><Input name="note" defaultValue={note ?? ""} maxLength={500} placeholder="Нотатка про горщик" aria-label="Нотатка" /></div>
          <Button type="submit" variant="secondary">Зберегти</Button>
        </form>
      </Panel>

      <Panel title={`Питання власника (${questions.length})`}>
        {questions.length === 0 ? <p className="sh-muted">Питань не було.</p> : (
          <ul className="sh-stack body-sm">{questions.map((q) => (
            <li key={q.id} className="sh-stack" style={{ gap: 4 }}>
              <p className="sh-muted">{when(q.createdAt)}{q.symptom ? ` · ${hintFor(q.symptom, "uk")?.symptom}` : ""}</p>
              <p>{q.body}</p>
              {q.answer ? <p><b>Відповідь:</b> {q.answer}</p> : <Link href="/admin/questions"><Badge tone="warning">Чекає відповіді</Badge></Link>}
            </li>))}</ul>
        )}
      </Panel>

      <Panel title="Відгук">
        {review ? (
          <div className="sh-stack body-sm">
            <div className="flex flex-wrap items-center gap-2"><Rating value={review.rating} /><StatusBadge kind="review" status={review.status} label={review.status === "approved" ? "схвалено" : review.status === "rejected" ? "відхилено" : "на модерації"} /><span className="sh-muted">{review.consentPublic ? "згода є" : "без згоди на публікацію"}</span></div>
            {review.body && <p>«{review.body}»</p>}
            <div><Button size="sm" variant="secondary" href="/admin/reviews">До відгуків</Button></div>
          </div>
        ) : <p className="sh-muted">Оцінки ще немає.</p>}
      </Panel>

      <Panel title="Заплановані нагадування">
        {upcoming.length === 0 ? <p className="sh-muted">Нагадувань немає (з'являться після активації).</p> : (
          <Timeline events={upcoming.map((r) => ({
            title: `${TASK_UK[r.task] ?? r.task}${r.species ? ` (${getHerb(r.species)?.names.uk ?? r.species})` : ""}`,
            time: `${when(r.dueAt)}${r.status === "sent" ? " · надіслано" : r.status === "snoozed" ? " · відкладено" : ""}`,
          }))} />
        )}
      </Panel>

      <Panel title={`Журнал догляду (${journal.length})`} actions={<Button size="sm" variant="ghost" href="/admin/journal?kind=problem">Усі проблеми</Button>}>
        {journal.length === 0 ? <p className="sh-muted">Власник ще не додавав записів.</p> : (
          <ul className="sh-stack">
            {journal.map((e) => (
              <li key={e.id} className="sh-stack" style={{ gap: 6 }}>
                <div className="flex flex-wrap items-center gap-2"><Badge tone={e.kind === "problem" ? "warning" : "leaf"}>{JOURNAL_UK[e.kind] ?? e.kind}</Badge><span className="body-sm sh-muted">{e.date}</span></div>
                {e.note && <p className="body-sm" style={{ whiteSpace: "pre-wrap" }}>{e.note}</p>}
                {e.photos.length > 0 && <ul className="flex flex-wrap gap-2">{e.photos.map((p) => (<li key={p}><a href={`/admin/journal-photo?path=${encodeURIComponent(p)}`} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/admin/journal-photo?path=${encodeURIComponent(p)}`} alt="Фото з журналу" loading="lazy" className="h-24 w-24 rounded-xl object-cover" /></a></li>))}</ul>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
