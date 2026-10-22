import Link from "next/link";
import { cookies } from "next/headers";
import { isLocale, t } from "@/lib/i18n";

export default async function NotFound() {
  const c = (await cookies()).get("lang")?.value;
  const locale = isLocale(c) ? c : "uk";
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl" aria-hidden>🥀</p>
      <h1 className="mt-4 text-3xl font-bold">{t(locale, "not_found")}</h1>
      <Link href={`/${locale}`} className="btn btn-primary mt-8">{t(locale, "nav_home")}</Link>
    </div>
  );
}
