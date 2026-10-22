import Link from "next/link";
import type { Herb, Locale } from "@/lib/types";
import { WATER_LABEL } from "@/lib/content";
import { pick, t } from "@/lib/i18n";
import { PotArt } from "./PotArt";

export const difficultyKey = (d: number) => (`diff_${d}`) as "diff_1" | "diff_2" | "diff_3";

export function HerbCard({ herb, locale }: { herb: Herb; locale: Locale }) {
  return (
    <Link href={`/${locale}/plants/${herb.slug}`} className="card group block overflow-hidden no-underline transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-square"><PotArt color={herb.color} /></div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-ink">{herb.names[locale]}</h3>
        <p className="text-sm italic text-muted">{herb.latin}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="badge">{t(locale, difficultyKey(herb.difficulty))}</span>
          <span className="badge">☀ {herb.light.hours} {t(locale, "hours")}</span>
        </div>
      </div>
    </Link>
  );
}

export function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="text-2xl" aria-hidden>{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="font-semibold leading-snug text-ink">{value}</span>
    </div>
  );
}

export function QuickFacts({ herb, locale }: { herb: Herb; locale: Locale }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Fact icon="☀️" label={t(locale, "light")} value={`${herb.light.hours} ${t(locale, "hours")}`} />
      <Fact icon="💧" label={t(locale, "water")} value={WATER_LABEL(herb.waterEveryDays, locale)} />
      <Fact icon="🌡" label={t(locale, "temperature")} value={`${herb.temp[0]}–${herb.temp[1]} °C`} />
      <Fact icon="🎚" label={t(locale, "difficulty")} value={t(locale, difficultyKey(herb.difficulty))} />
    </div>
  );
}

export const petKey = (p: Herb["petSafe"]) => (`pet_${p}`) as "pet_safe" | "pet_caution" | "pet_unknown";
export const cycleKey = (c: Herb["cycle"]) => (`cycle_${c}`) as "cycle_annual";

export function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="acc" open={open}>
      <summary>{title}</summary>
      <div className="acc-body">{children}</div>
    </details>
  );
}

export { pick };
