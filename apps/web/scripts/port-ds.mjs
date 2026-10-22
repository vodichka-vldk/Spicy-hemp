// Ports the design system's bundle.js / bundle.css / tokens.json into src/ds.
// Usage: node scripts/port-ds.mjs <folder with the design system's project/ files>
// Changes made to the bundle: ES module instead of window.SH, links go through next/link.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("pass the folder that holds the design system's project/ files"); process.exit(1); }
const ds = new URL("../src/ds/", import.meta.url).pathname;

let js = readFileSync(join(dir, "components/bundle.js"), "utf8").split("\n").slice(1).join("\n");
js = js.replace("(function () {\n  var React = window.React;", "{\n");
js = js.replace("  window.SH = {", "  Object.assign(SH, {");
js = js.replace(/\};\n\}\)\(\);\s*$/, "});\n}\n");
// internal links use next/link (no full page reload); external, anchors, downloads stay plain <a>
js = js.replaceAll("h('a', {", "h(A, {");
js = js.replace("var Tag = p.href ? 'a' : 'div';", "var Tag = p.href ? A : 'div';");
js = js.replace("var Tag = p.href ? 'a' : 'button';", "var Tag = p.href ? A : 'button';");
// form support: the bundle drops name/value/formAction, which server-rendered forms need
js = js.replace("href: p.href, onClick: p.onClick, disabled: p.disabled || p.loading, 'aria-busy'", "href: p.href, onClick: p.onClick, name: p.name, value: p.value, formAction: p.formAction, formNoValidate: p.formNoValidate, download: p.download, target: p.target, rel: p.rel, 'aria-label': p.ariaLabel, disabled: p.disabled || p.loading, 'aria-busy'");
js = js.replace("h('select', { id: id, className: 'sh-input body',", "h('select', { id: id, name: p.name, required: p.required, disabled: p.disabled, 'aria-label': p.ariaLabel, className: 'sh-input body',");
js = js.replace("h('input', { type: 'checkbox', checked: p.checked, defaultChecked: p.defaultChecked, onChange: p.onChange, disabled: p.disabled })", "h('input', { type: 'checkbox', id: p.id, name: p.name, value: p.value, checked: p.checked, defaultChecked: p.defaultChecked, onChange: p.onChange, disabled: p.disabled, required: p.required })");
js = js.replace("h('input', { type: 'checkbox', role: 'switch', checked: p.checked,", "h('input', { type: 'checkbox', role: 'switch', name: p.name, value: p.value, checked: p.checked,");
js = js.replace("h('input', { type: 'radio', name: p.name, value: p.value, checked: p.checked,", "h('input', { type: 'radio', name: p.name, value: p.value, required: p.required, checked: p.checked,");
const head = `// @ts-nocheck
"use client";
// Spicy Hemp design system components, ported from the design system's bundle.js by scripts/port-ds.mjs.
// Do not hand-edit: change the design system, then re-run the port. Typed access: ./index.ts.
import * as React from "react";
import NextLink from "next/link";

export const SH: Record<string, any> = {};
function A(p) {
  var href = p.href;
  if (!href || /^(https?:|mailto:|tel:|#)/.test(href) || p.download || p.target) return React.createElement("a", p);
  return React.createElement(NextLink, Object.assign({ prefetch: false }, p));
}
`;
// every component is also a named export: server components can only use a client module through its named exports
const names = [...js.matchAll(/Object\.assign\(SH, \{([^}]*)\}\)/g)][0][1].split(",").map((x) => x.split(":")[0].trim()).filter(Boolean);
writeFileSync(ds + "components.tsx", head + js + names.map((n) => `export const ${n} = SH.${n};`).join("\n") + "\n");

let css = readFileSync(join(dir, "components/bundle.css"), "utf8").split("\n").slice(1).join("\n").replace(/^@import url\(.*\);\n/m, "");
writeFileSync(ds + "components.css", css);
copyFileSync(join(dir, "tokens.json"), ds + "tokens.json");
copyFileSync(join(dir, "components/index.d.ts"), ds + "types.d.ts");
console.log("ported; now run: npm run ds:tokens");
