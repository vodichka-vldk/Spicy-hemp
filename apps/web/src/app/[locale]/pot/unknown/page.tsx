import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, EmptyState } from "@/ds";
import { isLocale, t } from "@/lib/i18n";

export const metadata: Metadata = { robots: { index: false } };

export default async function UnknownPot({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container-x max-w-xl py-16">
      <EmptyState
        icon="qr-code"
        title={t(locale, "pot_not_found")}
        text={t(locale, "pot_not_found_t")}
        action={
          <div className="sh-stack w-full">
            <form action="/p/lookup" method="get" className="flex gap-2">
              <label className="sr-only" htmlFor="code">{t(locale, "enter_code")}</label>
              <input id="code" name="code" className="input font-mono uppercase" placeholder="ABCD-EFGH" autoComplete="off" maxLength={12} required />
              <button className="btn btn-primary" type="submit">{t(locale, "open")}</button>
            </form>
            <Button variant="secondary" href={`/${locale}/plants`}>{t(locale, "cta_plants")}</Button>
          </div>
        }
      />
    </div>
  );
}
