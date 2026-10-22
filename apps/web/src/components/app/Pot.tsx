"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, Alert, Badge, Button, Input, Select } from "@/ds";
import { JOURNAL_KINDS } from "@/lib/domain";
import { compress } from "./api";
import type { Api, Entry, PotItem, Symptom } from "./types";
import type { T } from "./text";

/** A photo from the private journal: fetched with the Telegram header and shown from a blob. */
function JournalPhoto({ api, path }: { api: Api; path: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null, live = true;
    void api.blobUrl(`/api/app/photo?path=${encodeURIComponent(path)}`).then((u) => { url = u; if (live) setSrc(u); });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [api, path]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" className="h-24 w-24 rounded-xl object-cover" /> : <span className="sh-skel" style={{ width: 96, height: 96 }} aria-hidden />;
}

const kindLabel = (t: T, k: string) => (t as unknown as Record<string, string>)[`kind${k.charAt(0).toUpperCase()}${k.slice(1)}`] ?? k;
const lightLabel = (t: T, l: string) => (t as unknown as Record<string, string>)[`light${l.charAt(0).toUpperCase()}${l.slice(1)}`] ?? l;

export function Pot({ api, t, item, symptoms, onBack, onChanged }: { api: Api; t: T; item: PotItem; symptoms: Symptom[]; onBack: () => void; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(item.name ?? "");
  const [nameState, setNameState] = useState<"" | "saved" | "error">("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [kind, setKind] = useState("note");
  const [note, setNote] = useState("");
  const [light, setLight] = useState("");
  const [watered, setWatered] = useState(false);
  const [symptom, setSymptom] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [entryMsg, setEntryMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState({ text: "", symptom: "", asked: false, hint: null as { fix: string } | null });

  const load = useCallback(async () => { const r = await api.call("/api/app/journal/list", { code: item.code }); setEntries(r.status === 200 ? (r.json.entries as Entry[]) : []); }, [api, item.code]);
  useEffect(() => { void load(); }, [load]);

  const saveName = async () => {
    const r = await api.call("/api/app/rename", { code: item.code, name });
    setNameState(r.status === 200 ? "saved" : "error");
    if (r.status === 200) { setName((r.json.name as string | null) ?? ""); await onChanged(); }
  };

  const addEntry = async () => {
    setBusy(true); setEntryMsg(null);
    try {
      const fd = new FormData();
      fd.set("code", item.code); fd.set("kind", kind); fd.set("note", note);
      if (light) fd.set("light", light);
      if (kind === "care") fd.set("watered", watered ? "1" : "0");
      if (symptom) fd.set("symptom", symptom);
      for (const f of files) fd.append("files", await compress(f), f.name.replace(/\.[^.]+$/, "") + ".jpg");
      const r = await api.upload("/api/app/journal", fd);
      if (r.status === 200) {
        setNote(""); setLight(""); setWatered(false); setSymptom(""); setFiles([]); if (fileRef.current) fileRef.current.value = "";
        setEntryMsg({ tone: "success", text: t.entrySaved }); await load();
      } else {
        const e = r.json.error;
        setEntryMsg({ tone: "danger", text: e === "too_big" ? t.tooBig : e === "bad_photo" ? t.badPhoto : e === "too_many_photos" ? t.tooMany : t.error });
      }
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => { if (!window.confirm(t.removeAsk)) return; await api.call("/api/app/journal/delete", { id }); await load(); };

  const ask = async () => {
    const r = await api.call("/api/app/question", { code: item.code, text: q.text, symptom: q.symptom });
    if (r.status !== 200) return;
    setQ({ text: "", symptom: "", asked: true, hint: (r.json.hint as { fix: string } | null) ?? null });
    await onChanged();
  };

  return (
    <div className="sh-stack-lg">
      <div><Button variant="ghost" size="sm" icon="chevron-left" onClick={onBack}>{t.back}</Button></div>
      <div className="sh-surface sh-stack">
        <p className="overline sh-muted">{item.label}</p>
        <h2 className="h2">{item.name ?? item.title ?? item.label}</h2>
        <form className="flex items-start gap-2" onSubmit={(e) => { e.preventDefault(); void saveName(); }}>
          <div style={{ flex: 1 }}><Input value={name} onChange={(e: { target: { value: string } }) => { setName(e.target.value); setNameState(""); }} placeholder={t.potNamePh} aria-label={t.potName} maxLength={60} /></div>
          <Button type="submit" variant="accent">{t.save}</Button>
        </form>
        {nameState && <Alert tone={nameState === "saved" ? "success" : "danger"}>{nameState === "saved" ? t.saved : t.error}</Alert>}
        <div><Button size="sm" variant="ghost" href={`/p/${item.code}`} iconRight="arrow-right">{t.card}</Button></div>
      </div>

      <div className="sh-surface sh-stack">
        <h2 className="h3">{t.journal}</h2>
        <Accordion title={t.add}>
          <form className="sh-stack" onSubmit={(e) => { e.preventDefault(); void addEntry(); }}>
            <Select label={t.kind} value={kind} onChange={(e: { target: { value: string } }) => setKind(e.target.value)} options={JOURNAL_KINDS.filter((k) => k !== "question").map((k) => ({ value: k, label: kindLabel(t, k) }))} />
            {kind === "problem" && <Select ariaLabel={t.symptom} value={symptom} onChange={(e: { target: { value: string } }) => setSymptom(e.target.value)} options={[{ value: "", label: t.symptom }, ...symptoms.map((s) => ({ value: s.key, label: s.label }))]} />}
            <Input multiline rows={3} label={t.note} value={note} onChange={(e: { target: { value: string } }) => setNote(e.target.value)} placeholder={t.notePh} maxLength={2000} />
            <Select label={t.light} value={light} onChange={(e: { target: { value: string } }) => setLight(e.target.value)} options={[{ value: "", label: t.lightNone }, { value: "bright", label: t.lightBright }, { value: "diffused", label: t.lightDiffused }, { value: "low", label: t.lightLow }]} />
            {kind === "care" && <label className="sh-check body"><input type="checkbox" checked={watered} onChange={(e) => setWatered(e.target.checked)} /><span className="sh-check-box" aria-hidden /><span>{t.wateredYes}</span></label>}
            <label className="sh-stack body-sm" style={{ gap: 4 }}>
              <span className="label">{t.photos}</span>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))} />
            </label>
            {entryMsg && <Alert tone={entryMsg.tone}>{entryMsg.text}</Alert>}
            <div><Button type="submit" variant="accent" loading={busy}>{t.send}</Button></div>
          </form>
        </Accordion>
        {entries === null ? <p className="sh-muted">{t.loading}</p> : entries.length === 0 ? <p className="sh-muted">{t.noEntries}</p> : (
          <ul className="sh-stack">
            {entries.map((e) => (
              <li key={e.id} className="sh-surface sh-stack" style={{ padding: 12 }}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={e.kind === "problem" ? "warning" : "leaf"}>{kindLabel(t, e.kind)}</Badge>
                  <span className="body-sm sh-muted">{e.date}</span>
                  {e.light && <Badge tone="neutral" icon="sun">{lightLabel(t, e.light)}</Badge>}
                  {e.watered && <Badge tone="info" icon="droplet">{t.wateredYes}</Badge>}
                  <button type="button" className="sh-linkbtn body-sm ml-auto" onClick={() => void remove(e.id)}>{t.remove}</button>
                </div>
                {e.symptom && <p className="body-sm sh-muted">{symptoms.find((s) => s.key === e.symptom)?.label}</p>}
                {e.note && <p className="body-sm" style={{ whiteSpace: "pre-wrap" }}>{e.note}</p>}
                {e.photos.length > 0 && <div className="flex flex-wrap gap-2">{e.photos.map((p) => (<JournalPhoto key={p} api={api} path={p} />))}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sh-surface sh-stack">
        <h2 className="h3">{t.ask}</h2>
        <form className="sh-stack" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
          <Select ariaLabel={t.symptom} value={q.symptom} onChange={(e: { target: { value: string } }) => setQ({ ...q, symptom: e.target.value })} options={[{ value: "", label: t.symptom }, ...symptoms.map((s) => ({ value: s.key, label: s.label }))]} />
          <Input multiline rows={3} value={q.text} onChange={(e: { target: { value: string } }) => setQ({ ...q, text: e.target.value })} placeholder={t.askPh} aria-label={t.askPh} maxLength={1000} required />
          <div><Button type="submit" variant="accent">{t.sendQ}</Button></div>
        </form>
        {q.asked && <Alert tone="success">{t.sent}</Alert>}
        {q.hint && <Alert tone="info" title={t.firstAid}>{q.hint.fix}</Alert>}
        {item.questions.length > 0 && (
          <ul className="sh-stack">
            {item.questions.map((x) => (
              <li key={x.id} className="sh-surface" style={{ padding: 12 }}>
                <p className="body-sm">{x.body}</p>
                {x.answer ? <p className="body-sm label mt-1" style={{ color: "var(--leaf)" }}>{t.katya}: {x.answer}</p> : <p className="body-sm sh-muted mt-1">{t.waiting}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
