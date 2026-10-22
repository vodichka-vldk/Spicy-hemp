import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/ProductView";
import { loadProducts } from "@/lib/catalog-server";
import { isLocale } from "@/lib/i18n";
import { getProduct } from "@/lib/shop";

export const dynamic = "force-dynamic";

/** Any product, even a draft, rendered exactly as the shop shows it (admin only, buy button off). */
export default async function Preview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const locale = isLocale(lang) ? lang : "uk";
  const p = getProduct(slug, await loadProducts());
  if (!p) notFound();
  return (
    <div>
      <div className="sticky top-[6.5rem] z-30 flex flex-wrap items-center gap-2 rounded-xl bg-soft p-3 text-sm">
        <Link href={`/admin/catalog/${slug}`} className="font-semibold text-leaf">← Назад до редактора</Link>
        <span className="text-muted">Попередній перегляд{p.status !== "published" ? " (товар не опублікований, покупці його не бачать)" : ""}</span>
        <span className="ml-auto flex gap-1">
          {(["uk", "en"] as const).map((l) => (<Link key={l} href={`/admin/catalog/${slug}/preview?lang=${l}`} className="chip !min-h-8" aria-current={l === locale ? "page" : undefined}>{l.toUpperCase()}</Link>))}
        </span>
      </div>
      <ProductView p={p} locale={locale} preview />
    </div>
  );
}
