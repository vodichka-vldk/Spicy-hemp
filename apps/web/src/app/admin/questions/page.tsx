import Link from "next/link";
import { getHerb } from "@/lib/content";
import { displayId } from "@/lib/domain";
import { ANSWER_TEMPLATES, hintFor, isOverdue, waitingHours } from "@/lib/questions";
import { store } from "@/lib/store";
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
      <li className={`card p-4 text-sm ${late ? "border-clay" : ""}`}>
        <p className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/pots/${q.itemCode}`} className="font-semibold">{item ? displayId(item.kind, item.displayNo, "uk") : q.itemCode}{item?.ownerName ? ` «${item.ownerName}»` : ""}</Link>
          <span className="text-muted">{owner?.firstName ?? "—"}{owner?.username ? ` @${owner.username}` : ""} · {item?.species.map((s) => getHerb(s)?.names.uk ?? s).join(", ")}</span>
          {q.status === "open" && <span className={`badge ${late ? "!bg-clay !text-white" : ""}`}>{late ? `⏰ без відповіді ${waitingHours(q)} год` : `${waitingHours(q)} год`}</span>}
          {q.status === "closed" && <span className="badge">закрито</span>}
        </p>
        {sym && <p className="mt-1 text-muted">Симптом: {sym.symptom}</p>}
        <p className="mt-2 whitespace-pre-wrap">{q.body}</p>
        {q.answer && <p className="mt-2 rounded-lg bg-soft p-3"><b>Відповідь:</b> {q.answer}</p>}
        {q.status === "open" && (
          <form action={answer} className="mt-3 space-y-2">
            <input type="hidden" name="id" value={q.id} />
            <textarea name="answer" rows={3} className="input" placeholder="Ваша відповідь піде власнику в Telegram" required maxLength={2000} defaultValue={sym ? sym.fix : ""} aria-label="Відповідь" />
            <details className="text-muted"><summary className="cursor-pointer">Шаблони</summary>
              <ul className="mt-1 list-disc pl-5">{ANSWER_TEMPLATES.map((t) => (<li key={t.title}><b>{t.title}:</b> {t.uk}</li>))}</ul>
              <p className="mt-1 text-xs">Скопіюйте потрібний текст у поле відповіді й відредагуйте.</p>
            </details>
            <div className="flex gap-2"><button className="btn btn-primary" type="submit">Відповісти</button>
              <button className="btn btn-ghost" formAction={closeQuestion} type="submit" formNoValidate>Закрити без відповіді</button></div>
          </form>
        )}
      </li>
    );
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Питання від власників</h1>
      <p className="text-sm text-muted">Відповісти можна й у Telegram: просто відповідь-реплай на повідомлення з питанням. Якщо власник обрав симптом, у полі вже підставлена перша допомога з бази знань: відредагуйте її.</p>
      <section><h2 className="mb-2 text-xl font-bold">Чекають відповіді ({open.length})</h2><ul className="space-y-3">{open.map((q) => <Row key={q.id} q={q} />)}</ul>{open.length === 0 && <p className="text-muted">Питань немає.</p>}</section>
      {done.length > 0 && <section><h2 className="mb-2 text-xl font-bold">Опрацьовані</h2><ul className="space-y-3">{done.map((q) => <Row key={q.id} q={q} />)}</ul></section>}
    </div>
  );
}
