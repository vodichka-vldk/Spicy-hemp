// Project-level UI built from the design system: the pieces every screen needs that the system itself does not ship.
// Use these (and "@/ds") instead of hand-written markup. Server-safe: no hooks.
import Link from "next/link";
import { Alert, Badge, Icon } from "@/ds";

/** Page title with an optional lead, a back link and actions on the right. */
export function PageHeader({ title, lead, back, actions }: { title: React.ReactNode; lead?: React.ReactNode; back?: { href: string; label: string }; actions?: React.ReactNode }) {
  return (
    <header className="sh-stack">
      {back && (
        <Link href={back.href} className="body-sm inline-flex items-center gap-1 no-underline" style={{ color: "var(--ink-muted)" }}>
          <Icon name="chevron-left" size={16} />{back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 style={{ margin: 0 }}>{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {lead && <p className="body sh-muted" style={{ margin: 0 }}>{lead}</p>}
    </header>
  );
}

/** A card with a heading: the building block of every admin and form screen. */
export function Panel({ title, lead, actions, children, id }: { title?: React.ReactNode; lead?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="sh-surface sh-stack" aria-labelledby={id ? `${id}-t` : undefined}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title && <h2 id={id ? `${id}-t` : undefined} className="h3" style={{ margin: 0 }}>{title}</h2>}
          {actions}
        </div>
      )}
      {lead && <p className="body-sm sh-muted" style={{ margin: 0 }}>{lead}</p>}
      {children}
    </section>
  );
}

/** Result of the last action, passed through the URL (?saved=1, ?error=..., ?msg=...). */
export function Flash({ saved, error, msg, savedText = "Збережено" }: { saved?: string; error?: string; msg?: string; savedText?: string }) {
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (msg) return <Alert tone="info">{msg}</Alert>;
  if (saved) return <Alert tone="success">{savedText}</Alert>;
  return null;
}

type Tone = "leaf" | "neutral" | "accent" | "info" | "success" | "warning" | "danger";
const ORDER_TONE: Record<string, Tone> = {
  new: "info", pending_payment: "warning", cod_confirmed: "info", payment_failed: "danger", paid: "success", processing: "info", packed: "info",
  shipped: "info", delivered: "success", completed: "success", cancelled: "neutral", refund_requested: "warning", refunded: "neutral", return_requested: "warning", returned: "neutral",
};
const ITEM_TONE: Record<string, Tone> = { draft: "neutral", ready_for_sale: "success", reserved: "warning", sold: "info", shipped: "info", delivered: "info", activated: "success", returned: "warning", written_off: "neutral", archived: "neutral" };
const CATALOG_TONE: Record<string, Tone> = { published: "success", draft: "neutral", archived: "neutral" };
const REVIEW_TONE: Record<string, Tone> = { pending: "warning", approved: "success", rejected: "neutral" };

/** A status as a coloured badge; the tone follows the state, the label is always shown (colour is never the only signal). */
export function StatusBadge({ kind, status, label }: { kind: "order" | "item" | "catalog" | "review"; status: string; label: string }) {
  const map = { order: ORDER_TONE, item: ITEM_TONE, catalog: CATALOG_TONE, review: REVIEW_TONE }[kind];
  return <Badge tone={map[status] ?? "neutral"}>{label}</Badge>;
}

/** Row of small controls (filters, quick actions). */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

/** Definition list for facts about one thing (order, pot, owner). */
export function Facts({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="overline sh-muted">{i.label}</dt>
          <dd className="body" style={{ margin: 0 }}>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
