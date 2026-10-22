import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/HerbParts";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { GardenArt, gardenRatio } from "@/components/GardenArt";
import { PotArt } from "@/components/PotArt";
import { cardSections } from "@/lib/card";
import { getHerb } from "@/lib/content";
import { displayId } from "@/lib/domain";
import { isLocale, t, type DictKey } from "@/lib/i18n";
import { cleanCode, isValidCode } from "@/lib/pots";
import { loadProducts } from "@/lib/catalog-server";
import { getProduct, productTitle } from "@/lib/shop";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

type P = { params: Promise<{ locale: string; code: string }> };

/** Public card of a basket (opened by the QR code). Owner data and the care journal are never shown here. */
export default async function GardenCard({ params }: P) {
  const { locale, code: raw } = await params;
  const code = cleanCode(raw);
  if (!isLocale(locale) || !isValidCode(code)) notFound();
  const item = await store().getItem(code);
  if (!item) notFound();
  const product = getProduct(item.product, await loadProducts());
  const herbs = item.species.map((s) => getHerb(s)).filter((h): h is NonNullable<typeof h> => Boolean(h));
  const title = product ? productTitle(product, locale) : displayId(item.kind, item.displayNo, locale);
  const sections = item.product ? cardSections(item.product, locale, {}, product) : [];
  const made = new Date(item.readyOn + "T00:00:00Z").toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const bot = process.env.NEXT_PUBLIC_TG_BOT;
  const art = <GardenArt colors={herbs.map((h) => h.color)} />;
  const ratio = gardenRatio(herbs.length);

  return (
    <div className="container-x max-w-xl py-6">
      <figure className="card overflow-hidden">
        <div style={{ aspectRatio: ratio }}>
          <PhotoLightbox open={t(locale, "garden_photo_open")} close={t(locale, "garden_photo_close")} ratio={ratio}>{art}</PhotoLightbox>
        </div>
        <figcaption className="py-3 text-center font-display text-sm tracking-[0.3em] text-muted">{displayId(item.kind, item.displayNo, locale)}</figcaption>
      </figure>

      <header className="mt-5">
        <p className="text-xs uppercase tracking-widest text-muted">{t(locale, "garden_id")}: {String(item.displayNo).padStart(3, "0")}</p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="badge">{t(locale, `item_status_${item.status}` as DictKey)}</span>
          <span>{t(locale, "garden_made", { date: made })}</span>
        </p>
      </header>

      {bot && (
        <a href={`https://t.me/${bot}?startapp=${code}`} className="card mt-5 block p-4 no-underline">
          <span className="font-bold text-leaf">{t(locale, "garden_open_tg")} →</span>
          <span className="mt-1 block text-sm text-muted">{t(locale, "garden_open_tg_hint")}</span>
        </a>
      )}

      <div className="mt-5 space-y-2">
        {sections.map((s, i) => (<Accordion key={s.key} title={s.title} open={i === 0}><p>{s.body}</p></Accordion>))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-bold">{t(locale, "garden_composition")}</h2>
        <ul className="grid grid-cols-2 gap-3">
          {herbs.map((h) => (
            <li key={h.slug}>
              <Link href={`/${locale}/plants/${h.slug}`} className="card block overflow-hidden no-underline">
                <div className="aspect-[3/2]"><PotArt color={h.color} /></div>
                <div className="p-3"><h3 className="font-bold text-ink">{h.names[locale]}</h3><p className="text-xs text-muted">{h.latin}</p></div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
