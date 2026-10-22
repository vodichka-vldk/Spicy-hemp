"use client";

import { useEffect, useRef, useState } from "react";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type City = { ref: string; name: string; area: string };
type Warehouse = { ref: string; name: string };
type Errors = Record<string, string>;

/**
 * Nova Poshta city + branch picker. Falls back to plain text fields when the NP API is not configured or unreachable,
 * so checkout never depends on it. Submits `city`, `address` (branch text) and hidden `cityRef`/`warehouseRef`.
 */
export function NpPicker({ locale, errors }: { locale: Locale; errors: Errors }) {
  const [mode, setMode] = useState<"probing" | "api" | "manual">("probing");
  const [cities, setCities] = useState<City[]>([]);
  const [cityRef, setCityRef] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branchRef, setBranchRef] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch("/api/np/cities?q=Ки").then((r) => r.json()).then((j) => setMode(j.enabled ? "api" : "manual")).catch(() => setMode("manual"));
  }, []);

  function onCity(value: string) {
    const hit = cities.find((c) => c.name === value);
    setCityRef(hit?.ref ?? "");
    setBranchRef("");
    setWarehouses([]);
    clearTimeout(timer.current);
    if (hit) {
      fetch(`/api/np/warehouses?city=${hit.ref}`).then((r) => r.json()).then((j) => setWarehouses(j.warehouses ?? [])).catch(() => setMode("manual"));
      return;
    }
    if (value.trim().length < 2) return;
    timer.current = setTimeout(() => {
      fetch(`/api/np/cities?q=${encodeURIComponent(value.trim())}`).then((r) => r.json()).then((j) => setCities(j.cities ?? [])).catch(() => undefined);
    }, 250);
  }

  const err = (name: string) => (errors[name] ? <p id={`e-${name}`} className="err" role="alert">{dict.required[locale]}</p> : null);

  if (mode !== "api") {
    return (
      <>
        <label className="field"><span>{dict.city[locale]} *</span><input id="f-city" name="city" autoComplete="address-level2" className="input" aria-invalid={errors.city ? true : undefined} />{err("city")}</label>
        <label className="field"><span>{dict.np_branch[locale]} *</span><input id="f-address" name="address" autoComplete="street-address" className="input" aria-invalid={errors.address ? true : undefined} />{err("address")}</label>
      </>
    );
  }
  const branchName = warehouses.find((w) => w.ref === branchRef)?.name ?? "";
  return (
    <>
      <label className="field">
        <span>{dict.city[locale]} *</span>
        <input id="f-city" name="city" list="np-cities" autoComplete="off" className="input" onChange={(e) => onCity(e.target.value)} aria-invalid={errors.city ? true : undefined} />
        <datalist id="np-cities">{cities.map((c) => (<option key={c.ref} value={c.name}>{c.area}</option>))}</datalist>
        {err("city")}
      </label>
      <label className="field">
        <span>{dict.np_branch[locale]} *</span>
        <select id="f-address" className="input" value={branchRef} disabled={!cityRef} onChange={(e) => setBranchRef(e.target.value)} aria-invalid={errors.address ? true : undefined}>
          <option value="">{cityRef ? "—" : dict.city[locale]}</option>
          {warehouses.map((w) => (<option key={w.ref} value={w.ref}>{w.name}</option>))}
        </select>
        <input type="hidden" name="address" value={branchName} />
        {err("address")}
      </label>
      <input type="hidden" name="cityRef" value={cityRef} />
      <input type="hidden" name="warehouseRef" value={branchRef} />
    </>
  );
}
