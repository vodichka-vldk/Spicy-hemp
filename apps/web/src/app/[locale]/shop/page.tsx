import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PotArt } from "@/components/PotArt";
import { getHerb } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { currencyFor, formatMoney, priceMinor, products, productTitle } from "@/lib/shop";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: t(locale, "shop_title") } : {};
}

export default async function Shop({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cur = currencyFor(locale);
  const group = (kind: "set" | "pot") => products.filter((p) => p.kind === kind);
  const Grid = ({ kind }: { kind: "set" | "pot" }) => (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {group(kind).map((p) => (
        <li key={p.slug}>
          <Link href={`/${locale}/shop/${p.slug}`} className="card block h-full overflow-hidden no-underline transition hover:-translate-y-0.5 hover:shadow-md">
            <div className={`aspect-square ${kind === "set" ? "grid grid-cols-3" : ""}`}>
              {p.herbs.map((s) => (<div key={s} className={kind === "set" ? "overflow-hidden" : "h-full"}><PotArt color={getHerb(s)!.color} /></div>))}
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-base font-bold text-ink">{productTitle(p, locale)}</h3>
              <p className="mt-1 font-semibold text-leaf">{formatMoney(priceMinor(p.priceUah, cur), cur, locale)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="container-x py-8">
      <h1 className="text-4xl font-bold text-leaf">{t(locale, "shop_title")}</h1>
      <p className="mt-2 text-sm text-muted">{t(locale, "price_note")}</p>
      <h2 className="mb-4 mt-8 text-2xl font-bold">{t(locale, "sets_title")}</h2>
      <Grid kind="set" />
      <h2 className="mb-4 mt-12 text-2xl font-bold">{t(locale, "pot_label")}</h2>
      <Grid kind="pot" />
    </div>
  );
}
