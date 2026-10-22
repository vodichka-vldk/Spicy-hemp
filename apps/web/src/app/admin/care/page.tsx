import { OVERRIDES_KEY, ruleFor, type CareOverrides } from "@/lib/care";
import { getHerbs } from "@/lib/content";
import { store } from "@/lib/store";
import { saveCare } from "./actions";

export const dynamic = "force-dynamic";

/** How often owners are reminded to water and feed each herb. Empty field = default from the herb passport. */
export default async function Care() {
  const overrides = (await store().getSetting<CareOverrides>(OVERRIDES_KEY)) ?? {};
  const val = (slug: string, task: "water" | "feed") => {
    const o = overrides[slug]?.[task];
    return o === null ? "0" : o ? String(o.everyDays) : "";
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Графік догляду</h1>
      <p className="text-sm text-muted">Власник отримує нагадування окремо по кожній траві свого горщика. Вкажіть, як часто: кожні N днів. Порожнє поле означає стандарт (він показаний підказкою), 0 вимикає нагадування. Підживлення надсилається лише з квітня по вересень.</p>
      <form action={saveCare} className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Рослина</th><th>Полив, днів</th><th>Підживлення, днів</th></tr></thead>
          <tbody>
            {getHerbs().map((h) => (
              <tr key={h.slug} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold">{h.names.uk}</td>
                <td className="py-2 pr-3"><input type="number" min={0} max={365} name={`water_${h.slug}`} defaultValue={val(h.slug, "water")} placeholder={String(ruleFor(h.slug, "water")?.everyDays ?? "")} className="input w-24 !min-h-9 !py-1" aria-label={`Полив: ${h.names.uk}`} /></td>
                <td className="py-2 pr-3"><input type="number" min={0} max={365} name={`feed_${h.slug}`} defaultValue={val(h.slug, "feed")} placeholder={String(ruleFor(h.slug, "feed")?.everyDays ?? "")} className="input w-24 !min-h-9 !py-1" aria-label={`Підживлення: ${h.names.uk}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3"><button className="btn btn-primary" type="submit">Зберегти</button></div>
      </form>
    </div>
  );
}
