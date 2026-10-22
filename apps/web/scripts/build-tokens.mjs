// Generates src/ds/tokens.css from src/ds/tokens.json (the design system's tokens). Run: npm run ds:tokens
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../src/ds/tokens.json", import.meta.url), "utf8"));
const themes = t.color.themes.map((x) => x.id); // first = default
const out = [`/* Spicy Hemp — generated from tokens.json by scripts/build-tokens.mjs. Do not edit. */`];

const decl = (name, v) => `  --${name}: ${v};`;
const themed = (tokens, theme) => tokens.map((x) => decl(x.name, typeof x.value === "string" ? x.value : x.value[theme] ?? x.value[themes[0]])).join("\n");

const shared = [
  ...t.spacing.tokens, ...t.radius.tokens, ...t.size.tokens, ...t.breakpoint.tokens, ...t.zIndex.tokens,
].map((x) => decl(x.name, x.value)).join("\n");
const fonts = Object.entries(t.type.families).map(([k, v]) => decl(`font-${k}`, v)).join("\n");

// colours and shadows differ per theme; the first theme is also the default on :root
const perTheme = (theme) => `${themed(t.color.tokens, theme)}\n${themed(t.shadow.tokens, theme)}`;
out.push(`:root, [data-theme="${themes[0]}"] {\n${shared}\n${fonts}\n${perTheme(themes[0])}\n  color-scheme: dark;\n}`);
for (const th of themes.slice(1)) out.push(`[data-theme="${th}"] {\n${perTheme(th)}\n  color-scheme: ${th === "light" ? "light" : "dark"};\n}`);

for (const g of t.type.groups) {
  for (const s of g.styles) {
    const lines = [`  font-family: var(--font-${g.family});`, `  font-size: ${s.fontSize};`, `  line-height: ${s.lineHeight};`, `  font-weight: ${s.fontWeight};`];
    if (s.fontStyle) lines.push(`  font-style: ${s.fontStyle};`);
    if (s.letterSpacing) lines.push(`  letter-spacing: ${s.letterSpacing};`);
    if (s.name === "overline") lines.push("  text-transform: uppercase;");
    out.push(`.${s.name} {\n${lines.join("\n")}\n}`);
  }
}
writeFileSync(new URL("../src/ds/tokens.css", import.meta.url), out.join("\n\n") + "\n");
console.log("src/ds/tokens.css written");
