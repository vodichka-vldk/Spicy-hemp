import { notFound } from "next/navigation";
import { Alert, Chip } from "@/ds";
import { ProductView } from "@/components/ProductView";
import { loadProducts } from "@/lib/catalog-server";
import { isLocale } from "@/lib/i18n";
import { getProduct } from "@/lib/shop";
import { PageHeader } from "@/ui";

export const dynamic = "force-dynamic";

/** Any product, even a draft, rendered exactly as the shop shows it (admin only, buy button off). */
export default async function Preview({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const locale = isLocale(lang) ? lang : "uk";
  const p = getProduct(slug, await loadProducts());
  if (!p) notFound();
  return (
    <div className="sh-stack-lg">
      <PageHeader
        back={{ href: `/admin/catalog/${slug}`, label: "Назад до редактора" }}
        title="Попередній перегляд"
        actions={<>{(["uk", "en"] as const).map((l) => (<Chip key={l} href={`/admin/catalog/${slug}/preview?lang=${l}`} selected={l === locale}>{l.toUpperCase()}</Chip>))}</>}
      />
      {p.status !== "published" && <Alert tone="warning">Товар не опублікований, покупці його не бачать.</Alert>}
      <div data-theme="garden" className="rounded-[var(--radius-xl)]" style={{ background: "var(--bg-page)", color: "var(--ink)" }}>
        <ProductView p={p} locale={locale} preview />
      </div>
    </div>
  );
}
