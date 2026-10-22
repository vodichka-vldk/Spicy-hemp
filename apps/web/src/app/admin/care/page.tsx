import { Button, DataTable, Input } from "@/ds";
import { OVERRIDES_KEY, ruleFor, type CareOverrides } from "@/lib/care";
import { getHerbs } from "@/lib/content";
import { store } from "@/lib/store";
import { PageHeader } from "@/ui";
import { saveCare } from "./actions";

export const dynamic = "force-dynamic";

/** How often owners are reminded to water and feed each herb. Empty field = default from the herb passport. */
export default async function Care() {
  const overrides = (await store().getSetting<CareOverrides>(OVERRIDES_KEY)) ?? {};
  const val = (slug: string, task: "water" | "feed") => {
    const o = overrides[slug]?.[task];
    return o === null ? "0" : o ? String(o.everyDays) : "";
  };
  const cell = (slug: string, task: "water" | "feed", label: string, name: string) => (
    <div style={{ width: 110 }}><Input type="number" min={0} max={365} name={`${task}_${slug}`} defaultValue={val(slug, task)} placeholder={String(ruleFor(slug, task)?.everyDays ?? "")} aria-label={`${label}: ${name}`} /></div>
  );
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Графік догляду" lead="Власник отримує нагадування окремо по кожній траві свого горщика. Вкажіть, як часто: кожні N днів. Порожнє поле означає стандарт (він показаний підказкою), 0 вимикає нагадування. Підживлення надсилається лише з квітня по вересень." />
      <form action={saveCare} className="sh-stack">
        <DataTable
          caption="Графік догляду"
          columns={[{ key: "herb", label: "Рослина" }, { key: "water", label: "Полив, днів" }, { key: "feed", label: "Підживлення, днів" }]}
          rows={getHerbs().map((h) => ({ herb: <b>{h.names.uk}</b>, water: cell(h.slug, "water", "Полив", h.names.uk), feed: cell(h.slug, "feed", "Підживлення", h.names.uk) }))}
        />
        <div><Button type="submit" variant="primary">Зберегти</Button></div>
      </form>
    </div>
  );
}
