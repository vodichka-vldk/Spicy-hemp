import QRCode from "qrcode";
import { getHerb } from "@/lib/content";
import { qrBaseUrl } from "@/lib/payments";
import { formatCode } from "@/lib/pots";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Printable sheet: QR level M, quiet zone 4 modules, 25 mm squares. */
export default async function PrintSheet({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const { batch } = await searchParams;
  const pots = (await store().listPots()).filter((p) => !batch || p.batch === batch);
  const base = qrBaseUrl();
  const items = await Promise.all(
    pots.map(async (p) => ({
      p,
      svg: await QRCode.toString(`${base}/p/${p.code}`, { type: "svg", errorCorrectionLevel: "M", margin: 4, color: { dark: "#000000", light: "#ffffff" } }),
    })),
  );
  return (
    <div>
      <style>{`@media print { header, .noprint { display:none } main { padding:0 } } .qr svg { width:25mm; height:25mm }`}</style>
      <p className="noprint mb-4 text-muted">Batch: {batch ?? "all"} · {items.length} codes · print at 100% scale.</p>
      <ul className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-8">
        {items.map(({ p, svg }) => (
          <li key={p.code} className="break-inside-avoid text-center" style={{ breakInside: "avoid" }}>
            <div className="qr mx-auto w-fit" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="font-mono text-[9px]">{formatCode(p.code)}</p>
            <p className="text-[8px] text-muted">{getHerb(p.species)?.names.en}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
