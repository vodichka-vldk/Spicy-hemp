import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, EmptyState, Input } from "@/ds";
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
            <form action="/p/lookup" method="get" className="flex items-start gap-2">
              <div style={{ flex: 1 }}><Input id="code" name="code" label={t(locale, "enter_code")} className="font-mono" placeholder="ABCD-EFGH" autoComplete="off" maxLength={12} required /></div>
              <div style={{ paddingTop: 28 }}><Button type="submit" variant="accent">{t(locale, "open")}</Button></div>
            </form>
            <Button variant="secondary" href={`/${locale}/plants`}>{t(locale, "cta_plants")}</Button>
          </div>
        }
      />
    </div>
  );
}
