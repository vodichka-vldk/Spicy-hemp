"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, EmptyState, TaskCard } from "@/ds";
import type { Api, Task } from "./types";
import type { T } from "./text";

const TITLE = (t: T, k: Task["task"]) => (k === "water" ? t.taskWater : k === "feed" ? t.taskFeed : t.taskPhoto);
const TONE = { water: "sky", feed: "sage", photo: "sand" } as const;

/** Today: due care tasks, one card per pot and task, with Done and Snooze. */
export function Today({ api, t, onChanged }: { api: Api; t: T; onChanged?: () => void }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const load = useCallback(async () => { const r = await api.call("/api/app/today"); setTasks(r.status === 200 ? (r.json.tasks as Task[]) : []); }, [api]);
  useEffect(() => { void load(); }, [load]);
  const act = async (task: Task, action: "done" | "snooze") => {
    await api.call("/api/app/reminder", { code: task.itemCode, task: task.task, action });
    await load(); onChanged?.();
  };
  if (tasks === null) return <p className="sh-muted">{t.loading}</p>;
  if (tasks.length === 0) return <EmptyState icon="circle-check" title={t.todayEmpty} text={t.todayEmptyText} />;
  return (
    <ul className="sh-stack">
      {tasks.map((k) => (
        <li key={`${k.itemCode}-${k.task}`} className="sh-stack" style={{ gap: 8 }}>
          <TaskCard title={TITLE(t, k.task)} subtitle={`${k.label}${k.herbs.length ? ` · ${k.herbs.join(", ")}` : ""}${k.overdue ? ` · ${t.overdue}` : ""}`} tone={TONE[k.task]} />
          <div className="flex gap-2">
            <Button variant="accent" icon="check" onClick={() => void act(k, "done")}>{t.done}</Button>
            <Button variant="secondary" icon="clock" onClick={() => void act(k, "snooze")}>{t.snooze}</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
