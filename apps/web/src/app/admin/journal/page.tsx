import Link from "next/link";
import { Badge, Chip, EmptyState } from "@/ds";
import { displayId, JOURNAL_KINDS } from "@/lib/domain";
import { hintFor } from "@/lib/questions";
import { store } from "@/lib/store";
import { PageHeader, Panel } from "@/ui";

export const dynamic = "force-dynamic";

const KIND_UK: Record<string, string> = { note: "Нотатка", care: "Догляд", photo_report: "Фото-звіт", problem: "Проблема", harvest: "Збір урожаю", question: "Питання" };

/** Everything owners write and photograph, newest first. Filter "Проблема" to catch trouble early. */
export default async function Journal({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const db = store();
  const k = (JOURNAL_KINDS as readonly string[]).includes(kind ?? "") ? (kind as (typeof JOURNAL_KINDS)[number]) : undefined;
  const [entries, items, owners] = await Promise.all([db.listJournal(k ? { kind: k } : undefined), db.listItems(), db.listOwners()]);
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Журнал догляду" lead="Записи й фото, які власники додають у застосунку. Фото приватні: бачите їх лише ви." />
      <nav className="sh-chiprow" aria-label="Фільтр">
        <Chip href="/admin/journal" selected={!k}>Усі</Chip>
        {JOURNAL_KINDS.filter((x) => x !== "question").map((x) => (<Chip key={x} href={`/admin/journal?kind=${x}`} selected={k === x}>{KIND_UK[x]}</Chip>))}
      </nav>
      {entries.length === 0 ? <EmptyState icon="clipboard-list" title="Записів ще немає" /> : (
        <Panel>
          <ul className="sh-stack">
            {entries.slice(0, 100).map((e) => {
              const item = items.find((i) => i.code === e.itemCode);
              const owner = owners.find((o) => o.id === e.ownerId);
              return (
                <li key={e.id} className="sh-stack" style={{ gap: 6 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={e.kind === "problem" ? "warning" : "leaf"}>{KIND_UK[e.kind]}</Badge>
                    <Link href={`/admin/pots/${e.itemCode}`} className="label">{item ? displayId(item.kind, item.displayNo, "uk") : e.itemCode}</Link>
                    <span className="body-sm sh-muted">{owner?.firstName ?? "—"} · {e.date}</span>
                  </div>
                  {e.symptom && <p className="body-sm sh-muted">Симптом: {hintFor(e.symptom, "uk")?.symptom}</p>}
                  {e.note && <p className="body" style={{ whiteSpace: "pre-wrap" }}>{e.note}</p>}
                  {e.photos.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {e.photos.map((p) => (
                        <li key={p}><a href={`/admin/journal-photo?path=${encodeURIComponent(p)}`} target="_blank" rel="noopener noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/admin/journal-photo?path=${encodeURIComponent(p)}`} alt="Фото з журналу" loading="lazy" className="h-24 w-24 rounded-xl object-cover" /></a></li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
