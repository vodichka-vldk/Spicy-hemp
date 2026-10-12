import { glazeColor, type Glaze } from "@/lib/shop-calc";

/** Simple vector illustration used until real photography is available. */
export function PotArt({ color, glaze = "sage", label }: { color: string; glaze?: Glaze; label?: string }) {
  const pot = glazeColor[glaze];
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label ?? ""} aria-hidden={label ? undefined : true} className="h-full w-full">
      <rect width="200" height="200" fill="var(--soft)" />
      <g fill={color}>
        <path d="M100 112c-4-34-22-56-44-62 4 30 20 54 44 62z" opacity=".9" />
        <path d="M100 112c4-38 24-62 48-68-4 34-22 58-48 68z" />
        <path d="M100 112c-2-30 0-56 0-78 12 20 14 50 0 78z" opacity=".8" />
        <path d="M100 118c-16-12-42-14-60-6 16 14 40 18 60 6z" opacity=".7" />
        <path d="M100 118c16-12 42-14 60-6-16 14-40 18-60 6z" opacity=".85" />
      </g>
      <path d="M58 118h84l-8 58a10 10 0 0 1-10 8H76a10 10 0 0 1-10-8z" fill={pot} />
      <rect x="52" y="110" width="96" height="14" rx="7" fill={pot} />
      <rect x="52" y="110" width="96" height="14" rx="7" fill="#000" opacity=".08" />
      <path d="M74 140c10 6 42 6 52 0" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="88" y="148" width="24" height="24" rx="3" fill="#fff" />
      <path d="M92 152h6v6h-6zM102 152h6v6h-6zM92 162h6v6h-6zM104 164h4v4h-4z" fill="#1d2420" />
    </svg>
  );
}
