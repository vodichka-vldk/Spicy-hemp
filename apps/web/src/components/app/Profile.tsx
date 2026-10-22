"use client";

import { useState } from "react";
import { Alert, SegmentedControl, Select, Switch } from "@/ds";
import type { Api, Owner } from "./types";
import type { Loc, T } from "./text";

const ZONES = ["Europe/Kyiv", "Europe/Warsaw", "Europe/Berlin", "Europe/London", "America/New_York", "UTC"];
const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);

export function Profile({ api, t, owner, onSaved }: { api: Api; t: T; owner: Owner; onSaved: (o: Partial<Owner>) => void }) {
  const [state, setState] = useState<"" | "saved" | "error">("");
  const save = async (patch: Partial<Owner>) => {
    const r = await api.call("/api/app/profile", patch);
    if (r.status === 200) { onSaved(r.json as Partial<Owner>); setState("saved"); } else setState("error");
  };
  const zones = ZONES.includes(owner.timezone) ? ZONES : [owner.timezone, ...ZONES];
  return (
    <div className="sh-stack-lg">
      {state && <Alert tone={state === "saved" ? "success" : "danger"}>{state === "saved" ? t.saved : t.error}</Alert>}
      <div className="sh-surface sh-stack">
        <Switch checked={owner.notify} onChange={(e: React.ChangeEvent<HTMLInputElement>) => void save({ notify: e.target.checked })}>{t.notify}</Switch>
      </div>
      <div className="sh-surface sh-stack">
        <h2 className="h3">{t.quiet}</h2>
        <div className="grid grid-cols-2 gap-3">
          <Select label={t.quietFrom} value={owner.quietFrom} options={HOURS.map((h) => ({ value: h, label: h }))} onChange={(e: { target: { value: string } }) => void save({ quietFrom: e.target.value })} />
          <Select label={t.quietUntil} value={owner.quietUntil} options={HOURS.map((h) => ({ value: h, label: h }))} onChange={(e: { target: { value: string } }) => void save({ quietUntil: e.target.value })} />
        </div>
        <Select label={t.timezone} value={owner.timezone} options={zones.map((z) => ({ value: z, label: z }))} onChange={(e: { target: { value: string } }) => void save({ timezone: e.target.value })} />
      </div>
      <div className="sh-surface sh-stack">
        <h2 className="h3">{t.language}</h2>
        <SegmentedControl label={t.language} value={owner.locale} options={[{ value: "uk", label: "UK" }, { value: "en", label: "EN" }]} onChange={(v: string) => void save({ locale: v as Loc })} />
      </div>
    </div>
  );
}
