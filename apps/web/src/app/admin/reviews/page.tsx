import Link from "next/link";
import { Badge, Button, EmptyState, Rating } from "@/ds";
import { store } from "@/lib/store";
import { PageHeader, Panel, StatusBadge } from "@/ui";
import { moderateReview } from "../actions";

export const dynamic = "force-dynamic";

const LABEL = { pending: "очікує", approved: "схвалено", rejected: "відхилено" } as const;

export default async function Reviews() {
  const reviews = await store().listReviews();
  const pending = reviews.filter((r) => r.status === "pending");
  const rest = reviews.filter((r) => r.status !== "pending");
  const Row = ({ r }: { r: (typeof reviews)[number] }) => (
    <li className="sh-surface sh-stack">
      <div className="flex flex-wrap items-center gap-2">
        <Rating value={r.rating} />
        <StatusBadge kind="review" status={r.status} label={LABEL[r.status]} />
        <Badge tone="neutral"><span className="font-mono">{r.product}</span></Badge>
        {r.itemCode && <Link href={`/admin/pots/${r.itemCode}`} className="font-mono body-sm">{r.itemCode}</Link>}
      </div>
      {r.body && <p className="body">{r.body}</p>}
      <p className="body-sm sh-muted">{r.authorName ?? "—"} · {r.createdAt.slice(0, 10)} · {r.photos.length} фото · {r.consentPublic ? "згода на публікацію є" : "немає згоди: публікувати не можна"}</p>
      {r.status !== "approved" && (
        <form action={moderateReview} className="flex gap-2">
          <input type="hidden" name="id" value={r.id} />
          <Button name="status" value="approved" type="submit" variant="primary" disabled={!r.consentPublic}>Схвалити</Button>
          <Button name="status" value="rejected" type="submit" variant="secondary">Відхилити</Button>
        </form>
      )}
    </li>
  );
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Відгуки" lead="Відгуки й фото потрапляють на сторінку товару лише за згодою власника та після вашого схвалення." />
      <Panel title={`На модерації (${pending.length})`}>
        {pending.length === 0 ? <EmptyState icon="circle-check" title="Нічого не чекає" /> : <ul className="sh-stack">{pending.map((r) => <Row key={r.id} r={r} />)}</ul>}
      </Panel>
      {rest.length > 0 && <Panel title="Опрацьовані"><ul className="sh-stack">{rest.map((r) => <Row key={r.id} r={r} />)}</ul></Panel>}
    </div>
  );
}
