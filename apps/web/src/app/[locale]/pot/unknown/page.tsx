import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { isLocale, t } from "@/lib/i18n";

export const metadata: Metadata = { robots: { index: false } };

export default async function UnknownPot({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container-x max-w-xl py-16 text-center">
      <p className="text-6xl" aria-hidden>🔎</p>
      <h1 className="mt-4 text-3xl font-bold">{t(locale, "pot_not_found")}</h1>
      <p className="mt-2 text-muted">{t(locale, "pot_not_found_t")}</p>
      <form action="/p/lookup" method="get" className="mt-8 flex gap-2">
        <label className="sr-only" htmlFor="code">{t(locale, "enter_code")}</label>
        <input id="code" name="code" className="input font-mono uppercase" placeholder="ABCD-EFGH" autoComplete="off" maxLength={12} required />
        <button className="btn btn-primary" type="submit">{t(locale, "open")}</button>
      </form>
      <Link href={`/${locale}/plants`} className="btn btn-ghost mt-8">{t(locale, "cta_plants")}</Link>
    </div>
  );
}
