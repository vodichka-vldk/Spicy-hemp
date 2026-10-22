import { getHerb } from "@/lib/content";
import { potLabel } from "@/lib/care";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** What needs doing today: due reminders of this owner, one card per pot and task. */
export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const db = store();
  const now = Date.now();
  const due = (await db.listReminders({ ownerId: a.owner.id, statuses: ["pending", "sent", "snoozed"] })).filter((r) => new Date(r.dueAt).getTime() <= now + 12 * 3_600_000 && r.task !== "review");
  const items = new Map((await db.listItems()).filter((i) => i.ownerId === a.owner.id).map((i) => [i.code, i]));
  const groups = new Map<string, { itemCode: string; task: string; label: string; herbs: string[]; dueAt: string; overdue: boolean }>();
  for (const r of due) {
    const item = items.get(r.itemCode);
    if (!item) continue;
    const key = `${r.itemCode}|${r.task}`;
    const g = groups.get(key) ?? { itemCode: r.itemCode, task: r.task, label: potLabel(item, a.owner.locale), herbs: [], dueAt: r.dueAt, overdue: false };
    if (r.species) g.herbs.push(getHerb(r.species)?.names[a.owner.locale] ?? r.species);
    if (r.dueAt < g.dueAt) g.dueAt = r.dueAt;
    g.overdue = new Date(g.dueAt).getTime() < now - 6 * 3_600_000;
    groups.set(key, g);
  }
  return Response.json({ tasks: [...groups.values()].sort((x, y) => x.dueAt.localeCompare(y.dueAt)) }, { headers: { "Cache-Control": "no-store" } });
}
