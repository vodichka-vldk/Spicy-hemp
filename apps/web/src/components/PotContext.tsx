"use client";

import { useEffect, useState } from "react";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

type Info = { code: string; batch: string; plantedOn: string };

/** Shows "your pot" details after a QR scan, keeping the plant page itself static and fast. */
export function PotContext({ locale, slug }: { locale: Locale; slug: string }) {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("pot");
    if (!code) return;
    const ctrl = new AbortController();
    fetch(`/api/pot/${encodeURIComponent(code)}?species=${slug}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Info | null) => setInfo(j))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [slug]);

  if (!info) return null;
  const date = new Date(info.plantedOn + "T00:00:00Z").toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <div className="card flex items-start gap-3 border-leaf bg-soft p-4" role="status">
      <span className="text-2xl" aria-hidden>🏺</span>
      <div>
        <p className="font-semibold">{dict.scan_hello[locale]}</p>
        <p className="text-sm text-muted">
          {dict.your_pot[locale]} · {dict.batch[locale]} {info.batch} · {dict.planted[locale]} {date}
        </p>
        <p className="mt-1 font-mono text-xs text-muted">{info.code.slice(0, 4)}-{info.code.slice(4)}</p>
      </div>
    </div>
  );
}
