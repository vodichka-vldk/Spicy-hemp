"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";

export function LangSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? `/${locale}`;
  const qs = useSearchParams()?.toString();
  const other: Locale = locale === "uk" ? "en" : "uk";
  const target = pathname.replace(/^\/(uk|en)(?=\/|$)/, `/${other}`) + (qs ? `?${qs}` : "");
  return (
    <Link href={target} hrefLang={other} lang={other} className="chip" prefetch={false} aria-label={other === "uk" ? "Українська" : "English"}>
      {other.toUpperCase()}
    </Link>
  );
}
