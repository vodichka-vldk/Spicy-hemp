"use client";

import { useEffect, useRef, useState } from "react";
import { Combobox, Input, Select } from "@/ds";
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
  const [cityText, setCityText] = useState("");
  const [listOpen, setListOpen] = useState(false);
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

  const need = (name: string) => (errors[name] ? dict.required[locale] : undefined);

  if (mode !== "api") {
    return (
      <>
        <Input id="f-city" name="city" label={`${dict.city[locale]} *`} autoComplete="address-level2" error={need("city")} />
        <Input id="f-address" name="address" label={`${dict.np_branch[locale]} *`} autoComplete="street-address" error={need("address")} />
      </>
    );
  }
  const branchName = warehouses.find((w) => w.ref === branchRef)?.name ?? "";
  return (
    <>
      <Combobox
        id="f-city"
        label={`${dict.city[locale]} *`}
        placeholder={dict.city[locale]}
        value={cityText}
        open={listOpen && cities.length > 0 && !cityRef}
        options={cities.map((c) => ({ value: c.ref, label: c.name, hint: c.area }))}
        selected={cityRef}
        emptyText="—"
        onChange={(e: { target: { value: string } }) => { setCityText(e.target.value); setListOpen(true); onCity(e.target.value); }}
        onSelect={(o: { value: string; label: string }) => { setCityText(o.label); setListOpen(false); onCity(o.label); }}
      />
      <input type="hidden" name="city" value={cityText} />
      {errors.city && <p className="body-sm is-error" role="alert">{dict.required[locale]}</p>}
      <Select
        id="f-address"
        label={`${dict.np_branch[locale]} *`}
        value={branchRef}
        disabled={!cityRef}
        options={[{ value: "", label: cityRef ? "—" : dict.city[locale] }, ...warehouses.map((w) => ({ value: w.ref, label: w.name }))]}
        onChange={(e: { target: { value: string } }) => setBranchRef(e.target.value)}
      />
      <input type="hidden" name="address" value={branchName} />
      {errors.address && <p className="body-sm is-error" role="alert">{dict.required[locale]}</p>}
      <input type="hidden" name="cityRef" value={cityRef} />
      <input type="hidden" name="warehouseRef" value={branchRef} />
    </>
  );
}
