import type { Herb, Locale } from "@/lib/types";
import { Accordion as DsAccordion, FactTile, Grid, PlantCard } from "@/ds";
import { WATER_LABEL } from "@/lib/content";
import { pick, t } from "@/lib/i18n";
import { PotArt } from "./PotArt";

export const difficultyKey = (d: number) => (`diff_${d}`) as "diff_1" | "diff_2" | "diff_3";

const TONES = ["card", "sage", "sand", "sky"] as const;

/** A plant in a list or grid (design system PlantCard). `tone` varies the card colour so a grid does not look flat. */
export function HerbCard({ herb, locale, tone = "card" }: { herb: Herb; locale: Locale; tone?: (typeof TONES)[number] }) {
  return (
    <PlantCard
      href={`/${locale}/plants/${herb.slug}`}
      name={herb.names[locale]}
      latin={herb.latin}
      tone={tone}
      image={<PotArt color={herb.color} />}
      badges={[{ label: t(locale, difficultyKey(herb.difficulty)), tone: "leaf" }, { label: `${herb.light.hours} ${t(locale, "hours")}`, icon: "sun", tone: "neutral" }]}
    />
  );
}

export const toneAt = (i: number) => TONES[i % TONES.length];

export function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <FactTile icon={icon} label={label} value={value} />;
}

export function QuickFacts({ herb, locale }: { herb: Herb; locale: Locale }) {
  return (
    <Grid cols="facts">
      <Fact icon="sun" label={t(locale, "light")} value={`${herb.light.hours} ${t(locale, "hours")}`} />
      <Fact icon="droplet" label={t(locale, "water")} value={WATER_LABEL(herb.waterEveryDays, locale)} />
      <Fact icon="thermometer" label={t(locale, "temperature")} value={`${herb.temp[0]}–${herb.temp[1]} °C`} />
      <Fact icon="sprout" label={t(locale, "difficulty")} value={t(locale, difficultyKey(herb.difficulty))} />
    </Grid>
  );
}

export const petKey = (p: Herb["petSafe"]) => (`pet_${p}`) as "pet_safe" | "pet_caution" | "pet_unknown";
export const cycleKey = (c: Herb["cycle"]) => (`cycle_${c}`) as "cycle_annual";

export function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <DsAccordion title={title} open={open}>{children}</DsAccordion>;
}

export { pick };
