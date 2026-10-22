import { cookies } from "next/headers";
import { Button, EmptyState } from "@/ds";
import { isLocale, t } from "@/lib/i18n";

export default async function NotFound() {
  const c = (await cookies()).get("lang")?.value;
  const locale = isLocale(c) ? c : "uk";
  return (
    <div className="container-x py-16">
      <EmptyState icon="leaf" title={t(locale, "not_found")} action={<Button variant="accent" href={`/${locale}`}>{t(locale, "nav_home")}</Button>} />
    </div>
  );
}
