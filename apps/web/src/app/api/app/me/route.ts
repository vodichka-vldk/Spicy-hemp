import { itemsOfOwner } from "@/lib/activation";
import { displayId } from "@/lib/domain";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { loadProducts } from "@/lib/catalog-server";
import { getProduct, productTitle } from "@/lib/shop";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** The signed-in owner and their pots; `startParam` is the pot code from the QR link, if any. */
export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const catalog = await loadProducts();
  const items = (await itemsOfOwner(store(), a.owner)).map((i) => {
    const p = getProduct(i.product, catalog);
    return {
      code: i.code, label: displayId(i.kind, i.displayNo, a.owner.locale), name: i.ownerName ?? null,
      title: p ? productTitle(p, a.owner.locale) : null, activatedAt: i.activatedAt ?? null,
    };
  });
  return Response.json({ owner: { firstName: a.owner.firstName ?? null, locale: a.owner.locale }, items, startParam: a.auth.startParam ?? null }, { headers: { "Cache-Control": "no-store" } });
}
