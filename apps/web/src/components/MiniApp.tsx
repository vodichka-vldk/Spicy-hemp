"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AppBar, Button, EmptyState, Grid, PlantCard, TabBar } from "@/ds";
import { PotArt } from "./PotArt";
import { useApi } from "./app/api";
import { Pot } from "./app/Pot";
import { Profile } from "./app/Profile";
import { Scan } from "./app/Scan";
import { Today } from "./app/Today";
import { TEXT, type Loc } from "./app/text";
import type { Me, Owner } from "./app/types";

type Tg = { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };
type View = { tab: "today" | "garden" | "scan" | "profile"; pot?: string };

const parse = (hash: string): View => {
  const h = hash.replace(/^#/, "");
  if (h.startsWith("pot/")) return { tab: "garden", pot: h.slice(4).toUpperCase() };
  return { tab: (["today", "garden", "scan", "profile"] as const).find((x) => x === h) ?? "today" };
};
const COLORS = ["#3f8f4a", "#2f9e6e", "#4d7c6f", "#6b8e5a", "#74b34f", "#5e9b53"];
const looksLikeCode = (s: string) => /^[2-9A-HJ-NP-Z]{8}$/.test(s);

/** Telegram Mini App for owners: Today, Pots (with the care journal), Scan, Profile. Every request carries Telegram's signed data. */
export function MiniApp({ bot }: { bot: string }) {
  const [initData, setInitData] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [view, setView] = useState<View>({ tab: "today" });
  const [msg, setMsg] = useState("");
  const api = useApi(initData);
  const locale: Loc = me?.owner.locale ?? (typeof navigator !== "undefined" && navigator.language.startsWith("en") ? "en" : "uk");
  const t = TEXT[locale];

  const load = useCallback(async (data?: string) => {
    const res = await fetch("/api/app/me", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `tma ${data ?? initData}` }, body: "{}" });
    if (res.status === 200) setMe((await res.json()) as Me); else setMsg("error");
  }, [initData]);

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
    s.onload = start; s.onerror = start; // outside Telegram the page explains how to open it
    document.head.appendChild(s);
    const onHash = () => setView(parse(window.location.hash));
    onHash(); window.addEventListener("hashchange", onHash);
    return () => { s.remove(); window.removeEventListener("hashchange", onHash); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (h: string) => { window.location.hash = h; };

  const activate = async (code: string) => {
    if (!looksLikeCode(code)) { setMsg("badCode"); return; }
    const r = await api.call("/api/app/activate", { code });
    if (r.status === 200) { setMsg(""); await load(); go(`pot/${code}`); return; }
    const err = r.json.error;
    setMsg(err === "not_found" ? "notFound" : err === "taken" ? "taken" : err === "not_sold" ? "notSold" : err === "bad_code" ? "badCode" : "error");
  };

  if (initData === null) return <p className="sh-muted">{t.loading}</p>;
  if (!initData) {
    return <EmptyState icon="qr-code" title="Spicy Hemp" text={t.openIn} action={bot ? <Button variant="accent" href={`https://t.me/${bot}`}>Telegram</Button> : undefined} />;
  }
  if (!me) return <p className="sh-muted">{msg ? t.error : t.loading}</p>;

  const pending = me.startParam && looksLikeCode(me.startParam) && !me.items.some((i) => i.code === me.startParam) ? me.startParam : null;
  const note = msg ? (t as unknown as Record<string, string>)[msg] : "";
  const pot = view.pot ? me.items.find((i) => i.code === view.pot) : undefined;
  const title = view.pot && pot ? (pot.name ?? pot.title ?? pot.label) : view.tab === "today" ? t.todayTitle : view.tab === "garden" ? t.gardenTitle : view.tab === "scan" ? t.scanTitle : t.profileTitle;
  const patchOwner = (o: Partial<Owner>) => setMe((m) => (m ? { ...m, owner: { ...m.owner, ...o } } : m));

  return (
    <div className="sh-stack-lg sh-has-tabbar">
      <AppBar title={title} eyebrow={t.hello(me.owner.firstName)} />
      {note && <Alert tone="danger">{note}</Alert>}

      {pending && (
        <section className="sh-surface sh-stack">
          <p className="label">{t.confirmQ(pending)}</p>
          <Button variant="accent" onClick={() => void activate(pending)}>{t.confirm}</Button>
        </section>
      )}

      {view.tab === "today" && <Today api={api} t={t} />}

      {view.tab === "garden" && !view.pot && (
        me.items.length === 0 ? (
          <EmptyState icon="sprout" title={t.gardenEmpty} text={t.gardenEmptyText} action={<Button variant="accent" icon="scan-line" onClick={() => go("scan")}>{t.addPot}</Button>} />
        ) : (
          <>
            <Grid cols="cards">
              {me.items.map((i, n) => (
                <PlantCard key={i.code} href={`#pot/${i.code}`} name={i.name ?? i.title ?? i.label} latin={i.label} tone={(["sage", "sand", "sky", "card"] as const)[n % 4]} image={<PotArt color={COLORS[n % COLORS.length]} />} arrow />
              ))}
            </Grid>
            <div><Button variant="secondary" icon="plus" onClick={() => go("scan")}>{t.addPot}</Button></div>
          </>
        )
      )}
      {view.tab === "garden" && view.pot && (pot ? <Pot api={api} t={t} item={pot} symptoms={me.symptoms} onBack={() => go("garden")} onChanged={() => load()} /> : <EmptyState icon="circle-alert" title={t.notFound} action={<Button variant="secondary" onClick={() => go("garden")}>{t.back}</Button>} />)}

      {view.tab === "scan" && <Scan t={t} message="" onCode={(c) => void activate(c)} />}
      {view.tab === "profile" && <Profile api={api} t={t} owner={me.owner} onSaved={patchOwner} />}

      <TabBar
        items={[
          { label: t.tabToday, icon: "calendar", href: "#today", current: view.tab === "today" },
          { label: t.tabGarden, icon: "sprout", href: "#garden", current: view.tab === "garden" },
          { label: t.tabScan, icon: "scan-line", href: "#scan", current: view.tab === "scan" },
          { label: t.tabProfile, icon: "user", href: "#profile", current: view.tab === "profile" },
        ]}
      />
    </div>
  );
}
