"use client";

import { useCallback, useEffect, useState } from "react";

type Q = { id: string; body: string; answer: string | null; status: string; createdAt: string };
type Item = { code: string; label: string; name: string | null; title: string | null; activatedAt: string | null; questions: Q[] };
type Symptom = { key: string; label: string };
type Me = { owner: { firstName: string | null; locale: "uk" | "en" }; items: Item[]; symptoms: Symptom[]; startParam: string | null };
type Tg = { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };

const TEXT = {
  uk: {
    title: "Мої горщики", hello: (n: string | null) => (n ? `Привіт, ${n}!` : "Привіт!"), empty: "У вас ще немає горщиків. Відскануйте QR-код на горщику, і він з'явиться тут.",
    name: "Ім'я горщика", namePh: "Наприклад, «Зелений сніданок»", save: "Зберегти", saved: "Збережено", card: "Картка горщика",
    confirmQ: (c: string) => `Додати горщик ${c} до вашого списку?`, confirm: "Так, це мій", notFound: "Такого горщика не знайдено.", taken: "Цей горщик уже належить комусь іншому.",
    notSold: "Цей горщик ще не продано, тому додати його не можна.", openIn: "Відкрийте цю сторінку з Telegram-бота, щоб побачити свої горщики.", error: "Щось пішло не так. Спробуйте ще раз.", loading: "Завантаження…",
    addCode: "Додати за кодом", codePh: "Код з наклейки", add: "Додати",
    ask: "Запитати Катю", askPh: "Опишіть, що вас турбує", symptom: "Що сталося?", other: "Інше", send: "Надіслати", sent: "Питання надіслано Каті.", firstAid: "Перша допомога", waiting: "Чекає на відповідь", katya: "Катя",
  },
  en: {
    title: "My pots", hello: (n: string | null) => (n ? `Hi, ${n}!` : "Hi!"), empty: "You have no pots yet. Scan the QR code on your pot and it will show up here.",
    name: "Pot name", namePh: "For example, “Green breakfast”", save: "Save", saved: "Saved", card: "Pot card",
    confirmQ: (c: string) => `Add pot ${c} to your list?`, confirm: "Yes, it's mine", notFound: "We could not find this pot.", taken: "This pot already belongs to someone else.",
    notSold: "This pot has not been sold yet, so it cannot be added.", openIn: "Open this page from the Telegram bot to see your pots.", error: "Something went wrong. Please try again.", loading: "Loading…",
    addCode: "Add by code", codePh: "Code from the sticker", add: "Add",
    ask: "Ask Katya", askPh: "Describe what worries you", symptom: "What happened?", other: "Other", send: "Send", sent: "Question sent to Katya.", firstAid: "First aid", waiting: "Waiting for an answer", katya: "Katya",
  },
} as const;

const looksLikeCode = (s: string) => /^[2-9A-HJ-NP-Z]{8}$/.test(s);

/** Telegram Mini App: the owner's pots. Every request carries Telegram's signed initData, the server verifies it. */
export function MiniApp({ bot }: { bot: string }) {
  const [initData, setInitData] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [code, setCode] = useState("");
  const locale = me?.owner.locale ?? (typeof navigator !== "undefined" && navigator.language.startsWith("en") ? "en" : "uk");
  const t = TEXT[locale];

  const call = useCallback(async (path: string, body?: unknown, data = initData) => {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `tma ${data}` }, body: JSON.stringify(body ?? {}) });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  }, [initData]);

  const load = useCallback(async (data: string) => {
    const r = await call("/api/app/me", {}, data);
    if (r.status === 200) setMe(r.json as unknown as Me); else setMsg("error");
  }, [call]);

  useEffect(() => {
    const start = () => {
      const w = (window as unknown as { Telegram?: Tg }).Telegram?.WebApp;
      w?.ready?.(); w?.expand?.();
      const data = w?.initData ?? "";
      setInitData(data);
      if (data) void load(data);
    };
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.onload = start; s.onerror = start; // without the script (outside Telegram) the page explains how to open it
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [load]);

  const activate = async (c: string) => {
    const r = await call("/api/app/activate", { code: c });
    if (r.status === 200) { setMsg(""); setCode(""); await load(initData!); return; }
    const err = r.json.error;
    setMsg(err === "not_found" ? "notFound" : err === "taken" ? "taken" : err === "not_sold" ? "notSold" : "error");
  };

  if (initData === null) return <p className="text-muted">{t.loading}</p>;
  if (!initData) {
    return (
      <div className="card p-5">
        <h1 className="text-2xl font-bold text-leaf">Spicy Hemp</h1>
        <p className="mt-2">{t.openIn}</p>
        {bot && <a className="btn btn-primary mt-4" href={`https://t.me/${bot}`}>Telegram</a>}
      </div>
    );
  }
  if (!me) return <p className="text-muted">{msg ? t.error : t.loading}</p>;

  const pending = me.startParam && looksLikeCode(me.startParam) && !me.items.some((i) => i.code === me.startParam) ? me.startParam : null;
  const note = msg && (t as unknown as Record<string, string>)[msg];
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold text-leaf">{t.title}</h1>
        <p className="text-muted">{t.hello(me.owner.firstName)}</p>
      </header>
      {note && <p role="alert" className="rounded-lg bg-soft p-3 text-sm font-semibold text-clay">{note}</p>}

      {pending && (
        <section className="card p-4">
          <p className="font-semibold">{t.confirmQ(pending)}</p>
          <button className="btn btn-primary mt-3" onClick={() => void activate(pending)}>{t.confirm}</button>
        </section>
      )}

      {me.items.length === 0 && !pending && <p className="card p-4 text-muted">{t.empty}</p>}
      <ul className="space-y-3">
        {me.items.map((i) => (<PotRow key={i.code} item={i} t={t} call={call} symptoms={me.symptoms} reload={() => load(initData!)} />))}
      </ul>

      <section className="card p-4">
        <h2 className="font-semibold">{t.addCode}</h2>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); void activate(code.toUpperCase().replace(/[^A-Z0-9]/g, "")); }}>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.codePh} aria-label={t.codePh} maxLength={12} autoCapitalize="characters" />
          <button className="btn btn-ghost" type="submit">{t.add}</button>
        </form>
      </section>
    </div>
  );
}

function PotRow({ item, t, call, symptoms, reload }: { item: Item; t: (typeof TEXT)["uk"] | (typeof TEXT)["en"]; call: (p: string, b?: unknown) => Promise<{ status: number; json: Record<string, unknown> }>; symptoms: Symptom[]; reload: () => Promise<void> }) {
  const [text, setText] = useState("");
  const [symptom, setSymptom] = useState("");
  const [hint, setHint] = useState<{ symptom: string; fix: string } | null>(null);
  const [asked, setAsked] = useState(false);
  const ask = async () => {
    const r = await call("/api/app/question", { code: item.code, text, symptom });
    if (r.status !== 200) { setAsked(false); return; }
    setHint((r.json.hint as { symptom: string; fix: string } | null) ?? null);
    setAsked(true); setText(""); setSymptom("");
    await reload();
  };
  const [name, setName] = useState(item.name ?? "");
  const [state, setState] = useState<"" | "saved" | "error">("");
  const save = async () => {
    const r = await call("/api/app/rename", { code: item.code, name });
    setState(r.status === 200 ? "saved" : "error");
    if (r.status === 200) setName((r.json.name as string | null) ?? "");
  };
  return (
    <li className="card p-4">
      <p className="text-xs uppercase tracking-widest text-muted">{item.label}</p>
      <p className="text-lg font-bold">{item.name ?? item.title ?? item.label}</p>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <input className="input" value={name} onChange={(e) => { setName(e.target.value); setState(""); }} placeholder={t.namePh} aria-label={t.name} maxLength={60} />
        <button className="btn btn-primary" type="submit">{t.save}</button>
      </form>
      {state && <p role="status" className="mt-1 text-sm text-muted">{state === "saved" ? t.saved : t.error}</p>}
      <a className="mt-2 inline-block text-sm text-leaf underline" href={`/p/${item.code}`}>{t.card}</a>

      <details className="mt-3 rounded-xl border border-line p-3">
        <summary className="cursor-pointer font-semibold">{t.ask}</summary>
        <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
          <select className="input" value={symptom} onChange={(e) => setSymptom(e.target.value)} aria-label={t.symptom}>
            <option value="">{t.symptom}</option>
            {symptoms.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
          </select>
          <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.askPh} aria-label={t.askPh} maxLength={1000} required />
          <button className="btn btn-primary" type="submit">{t.send}</button>
        </form>
        {asked && <p role="status" className="mt-2 text-sm font-semibold">{t.sent}</p>}
        {hint && <p className="mt-2 rounded-lg bg-soft p-3 text-sm"><b>{t.firstAid}:</b> {hint.fix}</p>}
        {item.questions.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {item.questions.map((q) => (
              <li key={q.id} className="rounded-lg bg-soft p-3">
                <p>{q.body}</p>
                {q.answer ? <p className="mt-1 font-semibold text-leaf">{t.katya}: {q.answer}</p> : <p className="mt-1 text-muted">{t.waiting}</p>}
              </li>
            ))}
          </ul>
        )}
      </details>
    </li>
  );
}
