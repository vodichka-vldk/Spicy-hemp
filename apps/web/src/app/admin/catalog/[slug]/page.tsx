import { notFound } from "next/navigation";
import { Accordion, Alert, Badge, Button, Checkbox, Grid, Input, Select } from "@/ds";
import { Flash, PageHeader, Panel } from "@/ui";
import { cardSections, sectionTitles } from "@/lib/card";
import { loadProducts } from "@/lib/catalog-server";
import { getHerbs } from "@/lib/content";
import { CARE_SECTIONS } from "@/lib/domain";
import { autoSetPrice, getProduct, productTitle, products as builtIn } from "@/lib/shop";
import { store } from "@/lib/store";
import { photoUrl } from "@/lib/media";
import { changePhoto, duplicateProduct, resetProduct, saveProduct, uploadPhotos } from "../actions";

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
  return (
    <div className="sh-stack-lg">
      <PageHeader
        back={{ href: "/admin/catalog", label: "Каталог" }}
        title={title}
        actions={
          <>
            {!isNew && <Button variant="secondary" icon="search" href={`/admin/catalog/${slug}/preview`}>Перегляд</Button>}
            {product?.status === "published" && <Button variant="ghost" iconRight="arrow-up-right" href={`/uk/shop/${slug}`} target="_blank" rel="noopener noreferrer">Відкрити на сайті</Button>}
          </>
        }
      />
      <Flash saved={sp.saved} error={sp.error} />

      {!isNew && (
        <Panel title="Фото" lead="JPEG, PNG або WebP до 5 МБ, до 8 фото. Перше фото стає обкладинкою (на картці й на сторінці товару). Без фото показується ілюстрація.">
          {(entry?.photos?.length ?? 0) > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {entry!.photos!.map((ph, n) => (
                <li key={ph} className="sh-surface sh-stack" style={{ padding: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(ph)} alt={`Фото ${n + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                  <div className="flex flex-wrap items-center gap-1">
                    {n === 0 ? <Badge tone="leaf">Обкладинка</Badge> : (
                      <form action={changePhoto}><input type="hidden" name="slug" value={slug} /><input type="hidden" name="photo" value={ph} /><input type="hidden" name="op" value="cover" /><Button size="sm" variant="secondary" type="submit">Зробити обкладинкою</Button></form>
                    )}
                    <form action={changePhoto} className="ml-auto"><input type="hidden" name="slug" value={slug} /><input type="hidden" name="photo" value={ph} /><input type="hidden" name="op" value="delete" /><Button size="sm" variant="ghost" type="submit" icon="trash-2" ariaLabel={`Видалити фото ${n + 1}`}> </Button></form>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form action={uploadPhotos} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="slug" value={slug} />
            <input type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple required className="body-sm" aria-label="Файли фото" />
            <Button variant="primary" type="submit" icon="plus">Додати фото</Button>
          </form>
        </Panel>
      )}

      <form action={saveProduct} className="sh-stack-lg">
        <input type="hidden" name="original" value={isNew ? "" : slug} />
        <input type="hidden" name="kind" value={kind} />

        <Panel title="Основне">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="title_uk" label="Назва (укр)" defaultValue={entry?.title?.uk ?? ""} placeholder={product ? productTitle(base ?? product, "uk") : "Набір «Ранковий»"} />
            <Input name="title_en" label="Назва (eng)" defaultValue={entry?.title?.en ?? ""} placeholder={product ? productTitle(base ?? product, "en") : "“Morning” set"} />
            <Input name="tagline_uk" label="Короткий опис (укр)" defaultValue={entry?.tagline?.uk ?? ""} placeholder={base?.blurb?.uk ?? ""} />
            <Input name="tagline_en" label="Короткий опис (eng)" defaultValue={entry?.tagline?.en ?? ""} placeholder={base?.blurb?.en ?? ""} />
            <Input name="price" type="number" min={0} label="Ціна, ₴" defaultValue={entry?.priceUah || ""} placeholder={`авто: ${auto}`} hint={`Порожньо = розрахунок за складом${kind === "set" ? " зі знижкою на набір" : ""}.`} />
            <Select name="stock_mode" label="Наявність" defaultValue={entry?.stockMode ?? product?.stockMode ?? "in_stock"} options={[{ value: "in_stock", label: "В наявності" }, { value: "made_to_order", label: "На замовлення" }]} />
            <Select name="status" label="Статус" defaultValue={product?.status ?? "draft"} options={[{ value: "published", label: "Опубліковано" }, { value: "draft", label: "Чернетка (не видно на сайті)" }, { value: "archived", label: "В архіві" }]} />
            {isNew && <Input name="slug" label="Ідентифікатор (необов'язково)" placeholder="set-morning" pattern="[a-z0-9]+(-[a-z0-9]+)*" hint="Латиниця; якщо порожньо, зробимо з назви. Потім не змінюється." />}
          </div>
        </Panel>

        {kind === "set" && (
          <Panel title="Склад кошика" lead="Оберіть рослини в кошику. Кожен горщик такого кошика отримає цей склад і свій QR-код.">
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {herbs.map((h) => (
                <li key={h.slug} className="sh-surface" style={{ padding: 10 }}>
                  <Checkbox name="herbs" value={h.slug} defaultChecked={chosen.has(h.slug)}>
                    <span aria-hidden className="mr-1 inline-block h-3 w-3 rounded-full" style={{ background: h.color }} />{h.names.uk}
                  </Checkbox>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel title="Догляд на картці" lead="Ці розділи бачить покупець на сторінці товару й за QR-кодом. Порожнє поле означає стандартний текст (він показаний сірим).">
          <div>
            {CARE_SECTIONS.map((s, i) => (
              <Accordion key={s} title={`${sectionTitles[s].uk}${entry?.content?.[s] ? " (змінено)" : ""}`} open={i === 0 || Boolean(entry?.content?.[s])}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input multiline rows={4} name={`${s}_uk`} label="Укр" defaultValue={entry?.content?.[s]?.uk ?? ""} placeholder={defaults.find((d) => d.key === s)?.body ?? ""} maxLength={2000} />
                  <Input multiline rows={4} name={`${s}_en`} label="Eng" defaultValue={entry?.content?.[s]?.en ?? ""} placeholder={defaultsEn.find((d) => d.key === s)?.body ?? ""} maxLength={2000} />
                </div>
              </Accordion>
            ))}
          </div>
        </Panel>

        <div className="sticky bottom-0 z-10 flex flex-wrap gap-3 rounded-2xl p-3" style={{ background: "var(--glass)", backdropFilter: "blur(16px)" }}>
          <Button type="submit" variant="primary">Зберегти</Button>
          <Button variant="secondary" href="/admin/catalog">До каталогу</Button>
        </div>
      </form>

      {!isNew && (
        <Panel>
          <div className="flex flex-wrap items-center gap-3">
            {kind === "set" && <form action={duplicateProduct}><input type="hidden" name="slug" value={slug} /><Button variant="secondary" type="submit">Дублювати як чернетку</Button></form>}
            {(entry || !isBuiltIn) && (
              <form action={resetProduct}><input type="hidden" name="slug" value={slug} />
                <Button variant="danger" type="submit">{isBuiltIn ? "Скинути до стандартного" : "Видалити кошик"}</Button>
              </form>
            )}
            <Button variant="ghost" href="/admin/pots" iconRight="arrow-right">Створити горщики з QR</Button>
          </div>
          {!isBuiltIn && <Alert tone="info">Кошик можна видалити, лише поки з нього не виготовлено горщиків.</Alert>}
        </Panel>
      )}
    </div>
  );
}
