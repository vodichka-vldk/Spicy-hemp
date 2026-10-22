import { productsToCsv } from "@/lib/catalog-admin";
import { loadProducts } from "@/lib/catalog-server";

export const dynamic = "force-dynamic";

/** The whole catalogue as CSV (opens in Excel/Google Sheets; can be edited and imported back). */
export async function GET() {
  return new Response(productsToCsv(await loadProducts()), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="spicy-hemp-catalog-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
