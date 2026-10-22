import { PotArt } from "./PotArt";

/** Illustration of a basket: its herbs in a tidy grid (square for 1 and 3-4 herbs, wide for 2). Replaced by a photo when one exists. */
export function GardenArt({ colors, glaze }: { colors: string[]; glaze?: Parameters<typeof PotArt>[0]["glaze"] }) {
  const { cols, rows } = gardenGrid(colors.length);
  return (
    <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {colors.map((c, i) => (<div key={i} className="overflow-hidden"><PotArt color={c} glaze={glaze} /></div>))}
      {colors.length % cols === 1 && cols > 1 && <div className="bg-soft" aria-hidden />}
    </div>
  );
}

export function gardenGrid(n: number) {
  const cols = n <= 1 ? 1 : 2;
  return { cols, rows: Math.max(1, Math.ceil(n / cols)) };
}

export const gardenRatio = (n: number) => { const { cols, rows } = gardenGrid(n); return `${cols} / ${rows}`; };
