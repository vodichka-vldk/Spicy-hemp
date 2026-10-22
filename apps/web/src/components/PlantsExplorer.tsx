"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/types";
import { dict } from "@/lib/i18n";
import { Chip, Grid, PlantCard, SearchField } from "@/ds";
import { toneAt } from "./HerbParts";
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
    <div className="sh-stack">
      <SearchField placeholder={dict.search_ph[locale]} value={q} onChange={(e: { target: { value: string } }) => setQ(e.target.value)} />
      <div className="sh-chiprow" role="group" aria-label="Filters">
        {FILTERS.map((k) => (<Chip key={k} selected={f === k} onClick={() => setF(k)}>{label[k]}</Chip>))}
      </div>
      <p className="body-sm sh-muted" aria-live="polite">{list.length} {dict.results[locale]}</p>
      {list.length === 0 ? (
        <p className="sh-surface text-center sh-muted">{dict.no_results[locale]}</p>
      ) : (
        <Grid cols="cards">
          {list.map((h, i) => (
            <PlantCard
              key={h.slug}
              href={`/${locale}/plants/${h.slug}`}
              name={h.name}
              latin={h.latin}
              tone={toneAt(i)}
              image={<PotArt color={h.color} />}
              badges={[{ label: dict[`diff_${h.difficulty}` as "diff_1"][locale], tone: "leaf" }, { label: h.hours, icon: "sun", tone: "neutral" }]}
            />
          ))}
        </Grid>
      )}
    </div>
  );
}
