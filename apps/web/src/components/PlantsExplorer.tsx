"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { dict } from "@/lib/i18n";
import { PotArt } from "./PotArt";

export type HerbLite = {
  slug: string; latin: string; name: string; search: string; color: string;
  difficulty: 1 | 2 | 3; hours: string; sunny: boolean; petSafe: boolean; perennial: boolean; family: string;
};

const FILTERS = ["all", "easy", "sun", "pet", "perennial"] as const;
type F = (typeof FILTERS)[number];

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ'’ʼ`]/g, "");

export function PlantsExplorer({ herbs, locale }: { herbs: HerbLite[]; locale: Locale }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");

  const label: Record<F, string> = {
    all: dict.filter_all[locale], easy: dict.filter_easy[locale], sun: dict.filter_sun[locale],
    pet: dict.filter_pet[locale], perennial: dict.filter_perennial[locale],
  };

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return herbs.filter((h) => {
      if (nq && !h.search.includes(nq)) return false;
      if (f === "easy") return h.difficulty === 1;
      if (f === "sun") return h.sunny;
      if (f === "pet") return h.petSafe;
      if (f === "perennial") return h.perennial;
      return true;
    });
  }, [herbs, q, f]);

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <label className="sr-only" htmlFor="plant-search">{dict.search_ph[locale]}</label>
        <input id="plant-search" type="search" inputMode="search" autoComplete="off" className="input" placeholder={dict.search_ph[locale]} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filters">
          {FILTERS.map((k) => (
            <button key={k} type="button" className="chip shrink-0" aria-pressed={f === k} onClick={() => setF(k)}>{label[k]}</button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted" aria-live="polite">{list.length} {dict.results[locale]}</p>
      {list.length === 0 ? (
        <p className="card mt-4 p-8 text-center text-muted">{dict.no_results[locale]}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {list.map((h) => (
            <li key={h.slug}>
              <Link href={`/${locale}/plants/${h.slug}`} className="card block h-full overflow-hidden no-underline transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square"><PotArt color={h.color} /></div>
                <div className="p-3 sm:p-4">
                  <h2 className="text-base font-bold text-ink sm:text-lg">{h.name}</h2>
                  <p className="text-xs italic text-muted sm:text-sm">{h.latin}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="badge">{dict[`diff_${h.difficulty}` as "diff_1"][locale]}</span>
                    <span className="badge">☀ {h.hours}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
