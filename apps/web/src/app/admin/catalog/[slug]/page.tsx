import Link from "next/link";
import { notFound } from "next/navigation";
import { cardSections, sectionTitles } from "@/lib/card";
import { loadProducts } from "@/lib/catalog-server";
import { getHerbs } from "@/lib/content";
import { CARE_SECTIONS } from "@/lib/domain";
import { autoSetPrice, getProduct, productTitle, products as builtIn } from "@/lib/shop";
import { store } from "@/lib/store";
import { duplicateProduct, resetProduct, saveProduct } from "../actions";

export const dynamic = "force-dynamic";

/** Editor of one product; /admin/catalog/new creates a basket. Empty text fields fall back to the built-in text. */
export default async function Editor({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const isNew = slug === "new";
  const [all, entries] = await Promise.all([loadProducts(), store().listCatalog()]);
  const product = isNew ? undefined : getProduct(slug, all);
  if (!isNew && !product) notFound();
  const entry = entries.find((e) => e.slug === slug);
  const base = builtIn.find((p) => p.slug === slug); // built-in defaults, shown as placeholders
  const isBuiltIn = Boolean(base);
  const kind = product?.kind ?? "set";
  const herbs = getHerbs();
  const chosen = new Set(entry?.herbs ?? product?.herbs ?? []);
  const defaults = product ? cardSections(slug, "uk", {}, base) : [];
  const defaultsEn = product ? cardSections(slug, "en", {}, base) : [];
  const auto = kind === "set" && chosen.size ? autoSetPrice([...chosen]) : base?.priceUah ?? 0;
  const title = product ? productTitle(product, "uk") : "Новий кошик";
  const field = "field";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/catalog" className="text-sm text-muted">← Каталог</Link>
        <h1 className="text-3xl font-bold">{title}</h1>
        {product?.status === "published" && <a href={`/uk/shop/${slug}`} className="chip ml-auto" target="_blank" rel="noopener noreferrer">Відкрити на сайті ↗</a>}
      </div>
      {sp.saved && <p role="status" className="rounded-lg bg-soft p-3 text-sm font-semibold">✓ Збережено</p>}
      {sp.error && <p role="alert" className="rounded-lg bg-soft p-3 text-sm font-semibold text-clay">{sp.error}</p>}

      <form action={saveProduct} className="space-y-6">
        <input type="hidden" name="original" value={isNew ? "" : slug} />
        <input type="hidden" name="kind" value={kind} />

        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-xl font-bold sm:col-span-2">Основне</h2>
          <label className={field}><span>Назва (укр)</span><input name="title_uk" defaultValue={entry?.title?.uk ?? ""} placeholder={product ? productTitle(base ?? product, "uk") : "Набір «Ранковий»"} className="input" /></label>
          <label className={field}><span>Назва (eng)</span><input name="title_en" defaultValue={entry?.title?.en ?? ""} placeholder={product ? productTitle(base ?? product, "en") : "“Morning” set"} className="input" /></label>
          <label className={field}><span>Короткий опис (укр)</span><input name="tagline_uk" defaultValue={entry?.tagline?.uk ?? ""} placeholder={base?.blurb?.uk ?? ""} className="input" /></label>
          <label className={field}><span>Короткий опис (eng)</span><input name="tagline_en" defaultValue={entry?.tagline?.en ?? ""} placeholder={base?.blurb?.en ?? ""} className="input" /></label>
          <label className={field}><span>Ціна, ₴</span>
            <input name="price" type="number" min={0} defaultValue={entry?.priceUah || ""} placeholder={`авто: ${auto}`} className="input" />
            <small className="text-muted">Порожньо = розрахунок за складом{kind === "set" ? " зі знижкою на набір" : ""}.</small>
          </label>
          <label className={field}><span>Наявність</span>
            <select name="stock_mode" defaultValue={entry?.stockMode ?? product?.stockMode ?? "in_stock"} className="input">
              <option value="in_stock">В наявності</option><option value="made_to_order">На замовлення</option>
            </select>
          </label>
          <label className={field}><span>Статус</span>
            <select name="status" defaultValue={product?.status ?? "draft"} className="input">
              <option value="published">Опубліковано</option><option value="draft">Чернетка (не видно на сайті)</option><option value="archived">В архіві</option>
            </select>
          </label>
          {isNew && <label className={field}><span>Ідентифікатор (необов'язково)</span><input name="slug" className="input" placeholder="set-morning" pattern="[a-z0-9]+(-[a-z0-9]+)*" /><small className="text-muted">Латиниця; якщо порожньо, зробимо з назви. Потім не змінюється.</small></label>}
        </section>

        {kind === "set" && (
          <fieldset className="card p-5">
            <legend className="px-1 text-xl font-bold">Склад кошика</legend>
            <p className="mb-3 text-sm text-muted">Оберіть рослини в кошику. Кожен горщик такого кошика отримає цей склад і свій QR-код.</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {herbs.map((h) => (
                <li key={h.slug}>
                  <label className="card flex cursor-pointer items-center gap-2 p-2.5 text-sm">
                    <input type="checkbox" name="herbs" value={h.slug} defaultChecked={chosen.has(h.slug)} />
                    <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ background: h.color }} />{h.names.uk}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <section className="card p-5">
          <h2 className="text-xl font-bold">Догляд на картці</h2>
          <p className="mb-3 text-sm text-muted">Ці розділи бачить покупець на сторінці товару й за QR-кодом. Порожнє поле = стандартний текст (він показаний сірим).</p>
          <div className="space-y-3">
            {CARE_SECTIONS.map((s, i) => (
              <details key={s} open={i === 0 || Boolean(entry?.content?.[s])} className="rounded-xl border border-line p-3">
                <summary className="cursor-pointer font-semibold">{sectionTitles[s].uk}{entry?.content?.[s] ? " ✎" : ""}</summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className={field}><span>Укр</span><textarea name={`${s}_uk`} rows={4} defaultValue={entry?.content?.[s]?.uk ?? ""} placeholder={defaults.find((d) => d.key === s)?.body ?? ""} className="input" maxLength={2000} /></label>
                  <label className={field}><span>Eng</span><textarea name={`${s}_en`} rows={4} defaultValue={entry?.content?.[s]?.en ?? ""} placeholder={defaultsEn.find((d) => d.key === s)?.body ?? ""} className="input" maxLength={2000} /></label>
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="sticky bottom-0 -mx-1 flex flex-wrap gap-3 border-t border-line bg-card/95 p-3 backdrop-blur">
          <button className="btn btn-primary" type="submit">Зберегти</button>
          <Link href="/admin/catalog" className="btn btn-ghost">До каталогу</Link>
        </div>
      </form>

      {!isNew && (
        <section className="card flex flex-wrap items-center gap-3 p-5">
          {kind === "set" && <form action={duplicateProduct}><input type="hidden" name="slug" value={slug} /><button className="btn btn-ghost" type="submit">Дублювати як чернетку</button></form>}
          {(entry || !isBuiltIn) && (
            <form action={resetProduct}><input type="hidden" name="slug" value={slug} />
              <button className="btn btn-ghost" type="submit">{isBuiltIn ? "Скинути до стандартного" : "Видалити кошик"}</button>
            </form>
          )}
          <Link href="/admin/pots" className="btn btn-ghost">Створити горщики з QR →</Link>
        </section>
      )}
    </div>
  );
}
