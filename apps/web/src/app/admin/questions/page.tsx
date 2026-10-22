import Link from "next/link";
import { Badge, Button, EmptyState, Input } from "@/ds";
import { getHerb } from "@/lib/content";
import { displayId } from "@/lib/domain";
import { ANSWER_TEMPLATES, hintFor, isOverdue, waitingHours } from "@/lib/questions";
import { store } from "@/lib/store";
import { PageHeader, Panel } from "@/ui";
import { answer, closeQuestion } from "./actions";

export const dynamic = "force-dynamic";

/** Questions from owners: open ones first, oldest on top; red when unanswered for more than a day. */
export default async function Questions() {
  const db = store();
  const [questions, items, owners] = await Promise.all([db.listQuestions(), db.listItems(), db.listOwners()]);
  const open = questions.filter((q) => q.status === "open");
  const done = questions.filter((q) => q.status !== "open").reverse().slice(0, 30);
  const Row = ({ q }: { q: (typeof questions)[number] }) => {
    const item = items.find((i) => i.code === q.itemCode);
    const owner = owners.find((o) => o.id === q.ownerId);
    const sym = hintFor(q.symptom, "uk");
    const late = isOverdue(q);
    return (
      <li className="sh-surface sh-stack">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/pots/${q.itemCode}`} className="label">{item ? displayId(item.kind, item.displayNo, "uk") : q.itemCode}{item?.ownerName ? ` «${item.ownerName}»` : ""}</Link>
          <span className="body-sm sh-muted">{owner?.firstName ?? "—"}{owner?.username ? ` @${owner.username}` : ""} · {item?.species.map((s) => getHerb(s)?.names.uk ?? s).join(", ")}</span>
          {q.status === "open" && <Badge tone={late ? "danger" : "neutral"} icon={late ? "clock" : undefined}>{late ? `без відповіді ${waitingHours(q)} год` : `${waitingHours(q)} год`}</Badge>}
          {q.status === "closed" && <Badge tone="neutral">закрито</Badge>}
        </div>
        {sym && <p className="body-sm sh-muted">Симптом: {sym.symptom}</p>}
        <p className="body" style={{ whiteSpace: "pre-wrap" }}>{q.body}</p>
        {q.answer && <p className="body-sm"><b>Відповідь:</b> {q.answer}</p>}
        {q.status === "open" && (
          <form action={answer} className="sh-stack">
            <input type="hidden" name="id" value={q.id} />
            <Input multiline rows={3} name="answer" aria-label="Відповідь" placeholder="Ваша відповідь піде власнику в Telegram" required maxLength={2000} defaultValue={sym ? sym.fix : ""} />
            <details className="body-sm sh-muted"><summary className="cursor-pointer">Шаблони</summary>
              <ul className="mt-1 list-disc pl-5">{ANSWER_TEMPLATES.map((t) => (<li key={t.title}><b>{t.title}:</b> {t.uk}</li>))}</ul>
              <p className="mt-1">Скопіюйте потрібний текст у поле відповіді й відредагуйте.</p>
            </details>
            <div className="flex gap-2">
              <Button type="submit" variant="primary">Відповісти</Button>
              <Button type="submit" variant="secondary" formAction={closeQuestion} formNoValidate>Закрити без відповіді</Button>
            </div>
          </form>
        )}
      </li>
    );
  };
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Питання від власників" lead="Відповісти можна й у Telegram: просто відповідь-реплай на повідомлення з питанням. Якщо власник обрав симптом, у полі вже підставлена перша допомога з бази знань: відредагуйте її." />
      <Panel title={`Чекають відповіді (${open.length})`}>
        {open.length === 0 ? <EmptyState icon="circle-check" title="Питань немає" /> : <ul className="sh-stack">{open.map((q) => <Row key={q.id} q={q} />)}</ul>}
      </Panel>
      {done.length > 0 && <Panel title="Опрацьовані"><ul className="sh-stack">{done.map((q) => <Row key={q.id} q={q} />)}</ul></Panel>}
    </div>
  );
}
