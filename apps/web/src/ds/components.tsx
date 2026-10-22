// @ts-nocheck
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
{

  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useId = React.useId;
  var ICONS = {"leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\" /> <path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\" />", "sprout": "<path d=\"M7 20h10\" /> <path d=\"M10 20c5.5-2.5.8-6.4 3-10\" /> <path d=\"M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z\" /> <path d=\"M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z\" />", "droplet": "<path d=\"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z\" />", "droplets": "<path d=\"M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z\" /> <path d=\"M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97\" />", "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /> <path d=\"M12 2v2\" /> <path d=\"M12 20v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"m17.66 17.66 1.41 1.41\" /> <path d=\"M2 12h2\" /> <path d=\"M20 12h2\" /> <path d=\"m6.34 17.66-1.41 1.41\" /> <path d=\"m19.07 4.93-1.41 1.41\" />", "thermometer": "<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\" />", "spray-can": "<path d=\"M3 3h.01\" /> <path d=\"M7 5h.01\" /> <path d=\"M11 7h.01\" /> <path d=\"M3 7h.01\" /> <path d=\"M7 9h.01\" /> <path d=\"M3 11h.01\" /> <rect width=\"4\" height=\"4\" x=\"15\" y=\"5\" /> <path d=\"m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2\" /> <path d=\"m13 14 8-2\" /> <path d=\"m13 19 8-2\" />", "flower-2": "<path d=\"M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1\" /> <circle cx=\"12\" cy=\"8\" r=\"2\" /> <path d=\"M12 10v12\" /> <path d=\"M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z\" /> <path d=\"M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z\" />", "house": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /> <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />", "shopping-cart": "<circle cx=\"8\" cy=\"21\" r=\"1\" /> <circle cx=\"19\" cy=\"21\" r=\"1\" /> <path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\" />", "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /> <path d=\"m21 21-4.3-4.3\" />", "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />", "minus": "<path d=\"M5 12h14\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />", "chevron-right": "<path d=\"m9 18 6-6-6-6\" />", "chevron-left": "<path d=\"m15 18-6-6 6-6\" />", "bell": "<path d=\"M10.268 21a2 2 0 0 0 3.464 0\" /> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\" />", "qr-code": "<rect width=\"5\" height=\"5\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"5\" height=\"5\" x=\"16\" y=\"3\" rx=\"1\" /> <rect width=\"5\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\" /> <path d=\"M21 16h-3a2 2 0 0 0-2 2v3\" /> <path d=\"M21 21v.01\" /> <path d=\"M12 7v3a2 2 0 0 1-2 2H7\" /> <path d=\"M3 12h.01\" /> <path d=\"M12 3h.01\" /> <path d=\"M12 16v.01\" /> <path d=\"M16 12h1\" /> <path d=\"M21 12v.01\" /> <path d=\"M12 21v-1\" />", "calendar": "<path d=\"M8 2v4\" /> <path d=\"M16 2v4\" /> <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /> <path d=\"M3 10h18\" />", "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\" />", "heart": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" />", "truck": "<path d=\"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2\" /> <path d=\"M15 18H9\" /> <path d=\"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14\" /> <circle cx=\"17\" cy=\"18\" r=\"2\" /> <circle cx=\"7\" cy=\"18\" r=\"2\" />", "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />", "gift": "<rect x=\"3\" y=\"8\" width=\"18\" height=\"4\" rx=\"1\" /> <path d=\"M12 8v13\" /> <path d=\"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7\" /> <path d=\"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />", "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /> <path d=\"M2 12h20\" />", "camera": "<path d=\"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z\" /> <circle cx=\"12\" cy=\"13\" r=\"3\" />", "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /> <line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /> <line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /> <line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /> <line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /> <line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /> <line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /> <line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /> <line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />", "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />", "arrow-up-right": "<path d=\"M7 7h10v10\" /> <path d=\"M7 17 17 7\" />", "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />", "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />", "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />", "scan-line": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\" /> <path d=\"M17 3h2a2 2 0 0 1 2 2v2\" /> <path d=\"M21 17v2a2 2 0 0 1-2 2h-2\" /> <path d=\"M7 21H5a2 2 0 0 1-2-2v-2\" /> <path d=\"M7 12h10\" />", "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\" /> <path d=\"M12 22V12\" /> <path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\" /> <path d=\"m7.5 4.27 9 5.15\" />", "credit-card": "<rect width=\"20\" height=\"14\" x=\"2\" y=\"5\" rx=\"2\" /> <line x1=\"2\" x2=\"22\" y1=\"10\" y2=\"10\" />", "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /> <circle cx=\"12\" cy=\"10\" r=\"3\" />", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <polyline points=\"12 6 12 12 16 14\" />", "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />", "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /> <line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /> <line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />", "trash-2": "<path d=\"M3 6h18\" /> <path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\" /> <path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" /> <line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\" /> <line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\" />", "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /> <path d=\"m15 5 4 4\" />", "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <polyline points=\"7 10 12 15 17 10\" /> <line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />", "printer": "<path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\" /> <path d=\"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6\" /> <rect x=\"6\" y=\"14\" width=\"12\" height=\"8\" rx=\"1\" />", "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /> <path d=\"M18 17V9\" /> <path d=\"M13 17V5\" /> <path d=\"M8 17v-3\" />", "clipboard-list": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" /> <path d=\"M12 11h4\" /> <path d=\"M12 16h4\" /> <path d=\"M8 11h.01\" /> <path d=\"M8 16h.01\" />", "paw-print": "<circle cx=\"11\" cy=\"4\" r=\"2\" /> <circle cx=\"18\" cy=\"8\" r=\"2\" /> <circle cx=\"20\" cy=\"16\" r=\"2\" /> <path d=\"M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z\" />", "chef-hat": "<path d=\"M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z\" /> <path d=\"M6 17h12\" />", "snowflake": "<line x1=\"2\" x2=\"22\" y1=\"12\" y2=\"12\" /> <line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"22\" /> <path d=\"m20 16-4-4 4-4\" /> <path d=\"m4 8 4 4-4 4\" /> <path d=\"m16 4-4 4-4-4\" /> <path d=\"m8 20 4-4 4 4\" />", "scissors": "<circle cx=\"6\" cy=\"6\" r=\"3\" /> <path d=\"M8.12 8.12 12 12\" /> <path d=\"M20 4 8.12 15.88\" /> <circle cx=\"6\" cy=\"18\" r=\"3\" /> <path d=\"M14.8 14.8 20 20\" />", "list-checks": "<path d=\"m3 17 2 2 4-4\" /> <path d=\"m3 7 2 2 4-4\" /> <path d=\"M13 6h8\" /> <path d=\"M13 12h8\" /> <path d=\"M13 18h8\" />", "cloud-sun": "<path d=\"M12 2v2\" /> <path d=\"m4.93 4.93 1.41 1.41\" /> <path d=\"M20 12h2\" /> <path d=\"m19.07 4.93-1.41 1.41\" /> <path d=\"M15.947 12.65a4 4 0 0 0-5.925-4.128\" /> <path d=\"M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z\" />", "wind": "<path d=\"M12.8 19.6A2 2 0 1 0 14 16H2\" /> <path d=\"M17.5 8a2.5 2.5 0 1 1 2 4H2\" /> <path d=\"M9.8 4.4A2 2 0 1 1 11 8H2\" />", "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m9 12 2 2 4-4\" />", "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />", "badge-check": "<path d=\"M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z\" /> <path d=\"m9 12 2 2 4-4\" />", "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /> <rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />", "scan": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\" /> <path d=\"M17 3h2a2 2 0 0 1 2 2v2\" /> <path d=\"M21 17v2a2 2 0 0 1-2 2h-2\" /> <path d=\"M7 21H5a2 2 0 0 1-2-2v-2\" />"};

  function cx() { var o = []; for (var i = 0; i < arguments.length; i++) { var a = arguments[i]; if (a) o.push(a); } return o.join(' '); }
  function mode(m) { return m && m !== 'auto' ? 'is-' + m : ''; }

  /* ---------- Foundations ---------- */
  function Icon(p) {
    var size = p.size || 24;
    return h('svg', {
      className: cx('sh-icon', p.className), width: size, height: size, viewBox: '0 0 24 24', fill: p.fill || 'none',
      stroke: 'currentColor', strokeWidth: p.strokeWidth || 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': p.title ? undefined : true, role: p.title ? 'img' : undefined, 'aria-label': p.title,
      dangerouslySetInnerHTML: { __html: ICONS[p.name] || '' }
    });
  }
  Icon.names = Object.keys(ICONS);

  function Container(p) { return h(p.as || 'div', { className: cx('sh-container', p.narrow && 'is-narrow', p.className) }, p.children); }
  function Section(p) {
    return h(p.as || 'section', { className: cx('sh-section', p.theme === 'garden' && 'is-garden', p.hero && 'is-hero', p.className), 'data-theme': p.theme || undefined },
      h('div', { className: 'sh-container' }, p.title ? h('h2', { className: 'h2 sh-section-title' }, p.title) : null, p.lead ? h('p', { className: 'body sh-muted sh-section-lead' }, p.lead) : null, p.children));
  }

  /* ---------- Actions ---------- */
  function Button(p) {
    var Tag = p.href ? A : 'button';
    var props = {
      className: cx('sh-btn label', 'v-' + (p.variant || 'primary'), 's-' + (p.size || 'md'), p.full && 'is-full', p.loading && 'is-loading', p.className),
      href: p.href, onClick: p.onClick, name: p.name, value: p.value, formAction: p.formAction, formNoValidate: p.formNoValidate, download: p.download, target: p.target, rel: p.rel, 'aria-label': p.ariaLabel, disabled: p.disabled || p.loading, 'aria-busy': p.loading ? true : undefined
    };
    if (!p.href) props.type = p.type || 'button';
    return h(Tag, props, p.icon ? h(Icon, { name: p.icon, size: 20 }) : null, h('span', null, p.children), p.iconRight ? h(Icon, { name: p.iconRight, size: 20 }) : null);
  }
  function IconButton(p) {
    var Tag = p.href ? 'a' : 'button';
    return h(Tag, { className: cx('sh-iconbtn', 'v-' + (p.variant || 'solid'), 's-' + (p.size || 'md'), p.className), href: p.href, onClick: p.onClick, type: p.href ? undefined : 'button', 'aria-label': p.label, 'aria-pressed': p.pressed, disabled: p.disabled },
      h(Icon, { name: p.icon, size: p.size === 'lg' ? 26 : 22 }), p.badge ? h('span', { className: 'sh-iconbtn-badge caption' }, p.badge) : null);
  }
  function Chip(p) {
    var Tag = p.href ? 'a' : 'button';
    return h(Tag, { className: cx('sh-chip label', p.selected && 'is-selected', p.className), href: p.href, onClick: p.onClick, type: p.href ? undefined : 'button', 'aria-pressed': p.href ? undefined : !!p.selected, 'aria-current': p.href && p.selected ? 'page' : undefined },
      p.icon ? h('span', { className: 'sh-chip-icon' }, h(Icon, { name: p.icon, size: 20 })) : null, h('span', null, p.children), p.count != null ? h('span', { className: 'sh-chip-count caption' }, p.count) : null);
  }
  function Badge(p) { return h('span', { className: cx('sh-badge caption', 't-' + (p.tone || 'leaf'), p.className) }, p.icon ? h(Icon, { name: p.icon, size: 14 }) : null, p.children); }

  /* ---------- Forms ---------- */
  function Input(p) {
    var auto = useId(); var id = p.id || auto; var hint = id + '-hint';
    var rest = {}; for (var k in p) { if (['label', 'hint', 'error', 'multiline', 'icon', 'className', 'id'].indexOf(k) < 0) rest[k] = p[k]; }
    rest.id = id; rest.className = 'sh-input body'; rest['aria-invalid'] = p.error ? true : undefined; rest['aria-describedby'] = (p.error || p.hint) ? hint : undefined;
    return h('div', { className: cx('sh-field', p.error && 'has-error', p.className) },
      p.label ? h('label', { htmlFor: id, className: 'label sh-field-label' }, p.label) : null,
      h('div', { className: cx('sh-input-wrap', p.icon && 'has-icon') }, p.icon ? h(Icon, { name: p.icon, size: 20 }) : null, h(p.multiline ? 'textarea' : 'input', rest)),
      (p.error || p.hint) ? h('p', { id: hint, className: cx('body-sm sh-field-hint', p.error && 'is-error') }, p.error ? [h(Icon, { key: 'i', name: 'circle-alert', size: 16 }), ' ', p.error] : p.hint) : null);
  }
  function SearchField(p) {
    return h('form', { className: 'sh-search', role: 'search', onSubmit: function (e) { e.preventDefault(); if (p.onSubmit) p.onSubmit(); } },
      h(Icon, { name: 'search', size: 20 }),
      h('input', { className: 'sh-search-input body', type: 'search', placeholder: p.placeholder, value: p.value, defaultValue: p.defaultValue, onChange: p.onChange, 'aria-label': p.label || p.placeholder }),
      p.onFilter ? h(IconButton, { icon: 'sliders-horizontal', label: p.filterLabel || 'Filters', onClick: p.onFilter, size: 'sm', variant: 'solid' }) : null);
  }
  function Select(p) {
    var auto = useId(); var id = p.id || auto;
    return h('div', { className: 'sh-field' }, p.label ? h('label', { htmlFor: id, className: 'label sh-field-label' }, p.label) : null,
      h('div', { className: 'sh-input-wrap sh-select' }, h('select', { id: id, name: p.name, required: p.required, disabled: p.disabled, 'aria-label': p.ariaLabel, className: 'sh-input body', value: p.value, defaultValue: p.defaultValue, onChange: p.onChange }, (p.options || []).map(function (o) { return h('option', { key: o.value, value: o.value }, o.label); })), h(Icon, { name: 'chevron-down', size: 20 })));
  }
  function Checkbox(p) {
    return h('label', { className: cx('sh-check body', p.className) }, h('input', { type: 'checkbox', id: p.id, name: p.name, value: p.value, checked: p.checked, defaultChecked: p.defaultChecked, onChange: p.onChange, disabled: p.disabled, required: p.required }), h('span', { className: 'sh-check-box' }, h(Icon, { name: 'check', size: 16, strokeWidth: 3 })), h('span', null, p.children));
  }
  function Switch(p) {
    return h('label', { className: 'sh-switch body' }, h('span', null, p.children), h('input', { type: 'checkbox', role: 'switch', name: p.name, value: p.value, checked: p.checked, defaultChecked: p.defaultChecked, onChange: p.onChange }), h('span', { className: 'sh-switch-track', 'aria-hidden': true }, h('span', { className: 'sh-switch-thumb' })));
  }
  function RadioCard(p) {
    return h('label', { className: cx('sh-radiocard', p.checked && 'is-checked', p.className) },
      h('input', { type: 'radio', name: p.name, value: p.value, required: p.required, checked: p.checked, defaultChecked: p.defaultChecked, onChange: p.onChange }),
      p.icon ? h('span', { className: 'sh-radiocard-icon' }, h(Icon, { name: p.icon, size: 22 })) : null,
      h('span', { className: 'sh-radiocard-text' }, h('span', { className: 'label' }, p.title), p.description ? h('span', { className: 'body-sm sh-muted' }, p.description) : null),
      p.right ? h('span', { className: 'label sh-radiocard-right' }, p.right) : null, h('span', { className: 'sh-radiocard-dot', 'aria-hidden': true }));
  }
  function QuantityStepper(p) {
    var v = p.value, min = p.min != null ? p.min : 1, max = p.max != null ? p.max : 99;
    return h('div', { className: 'sh-stepper', role: 'group', 'aria-label': p.label || 'Quantity' },
      h('button', { type: 'button', className: 'sh-stepper-btn', 'aria-label': p.decLabel || '−', disabled: v <= min, onClick: function () { p.onChange(v - 1); } }, h(Icon, { name: 'minus', size: 18 })),
      h('span', { className: 'sh-stepper-val label', 'aria-live': 'polite' }, v),
      h('button', { type: 'button', className: 'sh-stepper-btn is-plus', 'aria-label': p.incLabel || '+', disabled: v >= max, onClick: function () { p.onChange(v + 1); } }, h(Icon, { name: 'plus', size: 18 })));
  }
  function SegmentedControl(p) {
    return h('div', { className: 'sh-seg', role: 'group', 'aria-label': p.label },
      (p.options || []).map(function (o) { var on = o.value === p.value; return h('button', { key: o.value, type: 'button', className: cx('sh-seg-btn label', on && 'is-on'), 'aria-pressed': on, onClick: function () { p.onChange && p.onChange(o.value); } }, o.label); }));
  }

  /* ---------- Navigation ---------- */
  function Header(p) {
    return h('header', { className: cx('sh-header', mode(p.mode), p.className) }, h('div', { className: 'sh-container sh-header-in' },
      h(A, { className: 'sh-brand h3', href: p.homeHref || '#', 'aria-label': p.brandLabel || p.brand }, h(Icon, { name: 'leaf', size: 26 }), h('span', null, p.brand)),
      h('nav', { className: 'sh-header-nav', 'aria-label': p.navLabel || 'Main' }, (p.items || []).map(function (i) { return h(A, { key: i.label, href: i.href || '#', className: cx('sh-header-link label', i.current && 'is-current'), 'aria-current': i.current ? 'page' : undefined }, i.label); })),
      h('div', { className: 'sh-header-end' }, p.end, p.onCart || p.cartHref ? h(IconButton, { icon: 'shopping-cart', label: p.cartLabel || 'Cart', href: p.cartHref, onClick: p.onCart, badge: p.cartCount, variant: 'solid' }) : null)));
  }
  function TabBar(p) {
    return h('nav', { className: cx('sh-tabbar', mode(p.mode), p.className), 'aria-label': p.label || 'Mobile' },
      h('ul', null, (p.items || []).map(function (i) {
        return h('li', { key: i.label }, h(A, { href: i.href || '#', className: cx('sh-tab', i.current && 'is-current'), 'aria-current': i.current ? 'page' : undefined, 'aria-label': i.label },
          h(Icon, { name: i.icon, size: 22 }), i.current ? h('span', { className: 'caption' }, i.label) : null, i.badge ? h('span', { className: 'sh-iconbtn-badge caption' }, i.badge) : null));
      })));
  }
  function Breadcrumbs(p) {
    return h('nav', { className: 'sh-crumbs body-sm', 'aria-label': p.label || 'Breadcrumb' }, h('ol', null, (p.items || []).map(function (i, n) {
      var last = n === p.items.length - 1;
      return h('li', { key: i.label }, last ? h('span', { 'aria-current': 'page' }, i.label) : h(A, { href: i.href || '#' }, i.label), last ? null : h(Icon, { name: 'chevron-right', size: 14 }));
    })));
  }
  function DateStrip(p) {
    return h('div', { className: 'sh-datestrip', role: 'listbox', 'aria-label': p.label || 'Days' }, (p.days || []).map(function (d) {
      return h('button', { key: d.key || d.date, type: 'button', role: 'option', 'aria-selected': !!d.selected, className: cx('sh-day', d.selected && 'is-selected'), onClick: function () { p.onSelect && p.onSelect(d); } },
        h('span', { className: 'caption' }, d.day), h('span', { className: 'label' }, d.date));
    }));
  }
  function Footer(p) {
    return h('footer', { className: 'sh-footer' }, h('div', { className: 'sh-container sh-footer-in' },
      h('div', null, h('p', { className: 'h3 sh-brand' }, h(Icon, { name: 'leaf', size: 24 }), h('span', null, p.brand)), p.about ? h('p', { className: 'body sh-muted sh-footer-about' }, p.about) : null),
      h('nav', { 'aria-label': p.helpLabel || 'Help' }, p.helpTitle ? h('p', { className: 'label' }, p.helpTitle) : null, h('ul', null, (p.links || []).map(function (l) { return h('li', { key: l.label }, h(A, { href: l.href || '#', className: 'body' }, l.label)); }))),
      p.note ? h('p', { className: 'body-sm sh-muted' }, p.note) : null));
  }

  /* ---------- Illustrations ---------- */
  var GLAZE = { sage: '#9db79a', cream: '#eadfc8', terracotta: '#c46a45' };
  function PotIllustration(p) {
    var color = p.color || '#3f8f4a', pot = GLAZE[p.glaze || 'sage'] || p.glaze;
    return h('svg', { className: cx('sh-pot', p.className), viewBox: '0 0 200 200', role: p.label ? 'img' : undefined, 'aria-label': p.label, 'aria-hidden': p.label ? undefined : true },
      p.bg === false ? null : h('rect', { width: 200, height: 200, className: 'sh-pot-bg' }),
      h('g', { fill: color }, h('path', { d: 'M100 112c-4-34-22-56-44-62 4 30 20 54 44 62z', opacity: .9 }), h('path', { d: 'M100 112c4-38 24-62 48-68-4 34-22 58-48 68z' }), h('path', { d: 'M100 112c-2-30 0-56 0-78 12 20 14 50 0 78z', opacity: .8 }), h('path', { d: 'M100 118c-16-12-42-14-60-6 16 14 40 18 60 6z', opacity: .7 }), h('path', { d: 'M100 118c16-12 42-14 60-6-16 14-40 18-60 6z', opacity: .85 })),
      h('path', { d: 'M58 118h84l-8 58a10 10 0 0 1-10 8H76a10 10 0 0 1-10-8z', fill: pot }), h('rect', { x: 52, y: 110, width: 96, height: 14, rx: 7, fill: pot }), h('rect', { x: 52, y: 110, width: 96, height: 14, rx: 7, fill: '#000', opacity: .08 }),
      h('path', { d: 'M74 140c10 6 42 6 52 0', stroke: '#fff', strokeOpacity: .35, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' }),
      p.qr === false ? null : [h('rect', { key: 'a', x: 88, y: 148, width: 24, height: 24, rx: 3, fill: '#fff' }), h('path', { key: 'b', d: 'M92 152h6v6h-6zM102 152h6v6h-6zM92 162h6v6h-6zM104 164h4v4h-4z', fill: '#0e3b2c' })]);
  }

  /* ---------- Content ---------- */
  function Rating(p) {
    var v = Math.round(p.value * 2) / 2;
    return h('span', { className: 'sh-rating body-sm', role: 'img', 'aria-label': v + ' / 5' + (p.count != null ? ' (' + p.count + ')' : '') },
      [0, 1, 2, 3, 4].map(function (i) { return h(Icon, { key: i, name: 'star', size: 16, fill: i < Math.floor(v) ? 'currentColor' : 'none', className: i < v ? 'is-on' : '' }); }), h('span', { className: 'sh-rating-num' }, p.value), p.count != null ? h('span', { className: 'sh-muted' }, '(' + p.count + ')') : null);
  }
  function Price(p) { return h('p', { className: cx('sh-price', p.size === 'lg' ? 'price-lg' : 'title') }, p.amount, p.note ? h('span', { className: 'caption sh-muted' }, p.note) : null); }
  function PlantCard(p) {
    var Tag = p.href ? A : 'div';
    return h(Tag, { className: cx('sh-plantcard', 'tone-' + (p.tone || 'card'), p.className), href: p.href },
      h('div', { className: 'sh-plantcard-text' }, h('h3', { className: 'title' }, p.name), p.latin ? h('p', { className: 'latin sh-muted' }, p.latin) : null,
        p.badges ? h('div', { className: 'sh-badges' }, p.badges.map(function (b, i) { return h(Badge, { key: i, tone: b.tone, icon: b.icon }, b.label); })) : null),
      h('div', { className: 'sh-plantcard-img' }, p.image),
      p.stats ? h('dl', { className: 'sh-plantcard-stats' }, p.stats.map(function (s) { return h('div', { key: s.label }, h('dd', { className: 'h3' }, s.value), h('dt', { className: 'body-sm sh-muted' }, s.label)); })) : null,
      p.arrow ? h('span', { className: 'sh-plantcard-go', 'aria-hidden': true }, h(Icon, { name: 'arrow-up-right', size: 22 })) : null);
  }
  function ProductCard(p) {
    return h('article', { className: cx('sh-product', 'tone-' + (p.tone || 'card'), p.className) },
      h(A, { className: 'sh-product-link', href: p.href || '#' }, h('div', { className: 'sh-product-img' }, p.image), h('h3', { className: 'title' }, p.title), p.subtitle ? h('p', { className: 'body-sm sh-muted sh-clamp' }, p.subtitle) : null),
      p.rating ? h(Rating, { value: p.rating, count: p.ratingCount }) : null,
      h('div', { className: 'sh-product-foot' }, h(Price, { amount: p.price, note: p.priceNote }), p.onAdd ? h(IconButton, { icon: 'plus', label: p.addLabel || 'Add to cart', onClick: p.onAdd, variant: 'lime' }) : null));
  }
  function FactTile(p) {
    return h('div', { className: cx('sh-fact', p.tone && 'tone-' + p.tone) }, h('span', { className: 'sh-fact-icon' }, h(Icon, { name: p.icon, size: 22 })), h('span', { className: 'sh-fact-text' }, h('span', { className: 'overline sh-muted' }, p.label), h('span', { className: 'label' }, p.value)));
  }
  function ProgressBar(p) {
    var v = Math.max(0, Math.min(100, p.value));
    return h('div', { className: 'sh-progress' }, h('div', { className: 'sh-progress-track', role: 'progressbar', 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': p.label }, h('span', { style: { width: v + '%' } })), h('span', { className: 'label sh-progress-val' }, v + '%'));
  }
  function TaskCard(p) {
    return h('article', { className: cx('sh-task', 'tone-' + (p.tone || 'sky'), p.done && 'is-done') }, h('div', { className: 'sh-task-text' }, h('h3', { className: 'title' }, p.title), h('p', { className: 'body-sm sh-muted' }, p.subtitle), p.progress != null ? h(ProgressBar, { value: p.progress, label: p.title }) : null), p.illustration ? h('div', { className: 'sh-task-art', 'aria-hidden': true }, p.illustration) : null);
  }
  function StatTile(p) {
    return h('div', { className: 'sh-stat' }, h('div', { className: 'sh-stat-top' }, h('span', { className: 'body-sm sh-muted' }, p.label), p.icon ? h('span', { className: 'sh-fact-icon' }, h(Icon, { name: p.icon, size: 20 })) : null), h('p', { className: 'h2' }, p.value), p.delta ? h(Badge, { tone: p.deltaTone || 'success' }, p.delta) : null);
  }
  function Accordion(p) { return h('details', { className: 'sh-acc', open: p.open }, h('summary', { className: 'label' }, h('span', null, p.title), h(Icon, { name: 'chevron-down', size: 22 })), h('div', { className: 'sh-acc-body body' }, p.children)); }
  function ReviewCard(p) { return h('figure', { className: 'sh-review' }, h(Rating, { value: p.rating }), h('blockquote', { className: 'body' }, p.text), h('figcaption', { className: 'body-sm sh-muted' }, p.author, p.meta ? ' · ' + p.meta : '')); }
  function GaugeBar(p) {
    var v = Math.max(0, Math.min(100, p.value));
    return h('div', { className: cx('sh-gauge', p.horizontal && 'is-horizontal') }, h('div', { className: 'sh-gauge-track', role: 'meter', 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': p.label }, h('span', { className: 'sh-gauge-mark label', style: p.horizontal ? { left: v + '%' } : { top: (100 - v) + '%' } }, p.display || v)), p.caption ? h('span', { className: 'caption sh-muted' }, p.caption) : null);
  }
  function PlantHero(p) {
    return h('section', { className: cx('sh-planthero', p.className), 'data-theme': p.theme || undefined },
      h('div', { className: 'sh-planthero-img' }, p.image),
      h('div', { className: 'sh-planthero-panel' }, h('h1', { className: 'plant-name' }, p.name), p.latin ? h('p', { className: 'latin sh-muted' }, p.latin) : null, p.tagline ? h('p', { className: 'body-lg' }, p.tagline) : null,
        p.badges ? h('div', { className: 'sh-badges' }, p.badges.map(function (b, i) { return h(Badge, { key: i, tone: b.tone, icon: b.icon }, b.label); })) : null,
        p.price ? h(Price, { amount: p.price, note: p.priceNote, size: 'lg' }) : null, p.children, p.actions ? h('div', { className: 'sh-planthero-actions' }, p.actions) : null));
  }
  function ScanFrame(p) { return h('div', { className: 'sh-scan' }, h('div', { className: 'sh-scan-view' }, p.children), h('span', { className: 'sh-scan-c c1' }), h('span', { className: 'sh-scan-c c2' }), h('span', { className: 'sh-scan-c c3' }), h('span', { className: 'sh-scan-c c4' }), p.hint ? h('p', { className: 'sh-scan-hint label' }, h(Icon, { name: 'scan-line', size: 18 }), p.hint) : null); }
  function fakeQr(code) {
    var n = 21, seed = 0, i, cells = [];
    for (i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    function finder(x, y) { return (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7); }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var on;
      if (finder(x, y)) { var fx = x % (n - 7 + (x >= n - 7 ? 0 : 7)), lx = x >= n - 7 ? x - (n - 7) : x, ly = y >= n - 7 ? y - (n - 7) : y; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4); }
      else on = rnd() > .52;
      if (on) cells.push(h('rect', { key: x + '-' + y, x: x, y: y, width: 1.02, height: 1.02 }));
    }
    return h('svg', { viewBox: '-1 -1 ' + (n + 2) + ' ' + (n + 2), className: 'sh-qr', role: 'img', 'aria-label': 'QR ' + code }, h('rect', { x: -1, y: -1, width: n + 2, height: n + 2, fill: '#fff' }), h('g', { fill: '#0e3b2c' }, cells));
  }
  function QrLabel(p) { return h('div', { className: 'sh-qrlabel' }, p.qr || fakeQr(p.code), h('p', { className: 'sh-qrlabel-code label' }, p.code), p.name ? h('p', { className: 'body-sm sh-muted' }, p.name) : null); }

  /* ---------- Commerce ---------- */
  function CartItem(p) {
    return h('li', { className: 'sh-cartitem' }, h('div', { className: 'sh-cartitem-img' }, p.image),
      h('div', { className: 'sh-cartitem-body' }, h(A, { className: 'title', href: p.href || '#' }, p.title), p.subtitle ? h('p', { className: 'body-sm sh-muted' }, p.subtitle) : null,
        h('div', { className: 'sh-cartitem-row' }, h(QuantityStepper, { value: p.qty, onChange: p.onQty, label: p.qtyLabel }), h('p', { className: 'title' }, p.price)),
        p.onRemove ? h('button', { type: 'button', className: 'sh-linkbtn body-sm', onClick: p.onRemove }, p.removeLabel || 'Remove') : null));
  }
  function OrderSummary(p) {
    return h('aside', { className: 'sh-summary' }, p.title ? h('h2', { className: 'h3' }, p.title) : null,
      h('dl', null, (p.rows || []).map(function (r) { return h('div', { key: r.label, className: 'sh-summary-row body' }, h('dt', { className: 'sh-muted' }, r.label), h('dd', null, r.value)); })),
      p.note ? h(Alert, { tone: 'info' }, p.note) : null,
      h('div', { className: 'sh-summary-total' }, h('span', { className: 'label' }, p.totalLabel || 'Total'), h('span', { className: 'price-lg' }, p.total)), p.cta);
  }
  function Steps(p) {
    return h('ol', { className: 'sh-steps', 'aria-label': p.label }, (p.steps || []).map(function (s, i) {
      var st = i < p.current ? 'done' : i === p.current ? 'current' : 'todo';
      return h('li', { key: s, className: 'sh-step is-' + st, 'aria-current': st === 'current' ? 'step' : undefined }, h('span', { className: 'sh-step-dot label' }, st === 'done' ? h(Icon, { name: 'check', size: 16, strokeWidth: 3 }) : i + 1), h('span', { className: 'body-sm' }, s));
    }));
  }
  function Timeline(p) {
    return h('ol', { className: 'sh-timeline' }, (p.events || []).map(function (e, i) { return h('li', { key: i, className: cx('sh-tl', e.done && 'is-done', e.current && 'is-current') }, h('span', { className: 'sh-tl-dot', 'aria-hidden': true }, e.done ? h(Icon, { name: 'check', size: 14, strokeWidth: 3 }) : null), h('div', null, h('p', { className: 'label' }, e.title), e.time ? h('p', { className: 'body-sm sh-muted' }, e.time) : null)); }));
  }

  /* ---------- Feedback ---------- */
  var TONE_ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-alert' };
  function Alert(p) {
    var tone = p.tone || 'info';
    return h('div', { className: cx('sh-alert', 't-' + tone, p.className), role: tone === 'danger' ? 'alert' : 'status' }, h(Icon, { name: TONE_ICON[tone], size: 22 }), h('div', null, p.title ? h('p', { className: 'label' }, p.title) : null, h('div', { className: 'body-sm' }, p.children)));
  }
  function Toast(p) {
    return h('div', { className: cx('sh-toast', 't-' + (p.tone || 'success')), role: 'status', 'aria-live': 'polite' }, h(Icon, { name: TONE_ICON[p.tone || 'success'], size: 20 }), h('span', { className: 'body-sm' }, p.children), p.action ? h('button', { type: 'button', className: 'sh-linkbtn label', onClick: p.onAction }, p.action) : null);
  }
  function EmptyState(p) {
    return h('div', { className: 'sh-empty' }, h('span', { className: 'sh-empty-icon' }, h(Icon, { name: p.icon || 'sprout', size: 40, strokeWidth: 1.5 })), h('h2', { className: 'h2' }, p.title), p.text ? h('p', { className: 'body sh-muted' }, p.text) : null, p.action);
  }
  function Skeleton(p) { return h('span', { className: cx('sh-skel', p.round && 'is-round'), style: { width: p.w || '100%', height: p.h || 16 }, 'aria-hidden': true }); }
  function Sheet(p) {
    var ref = useRef(null);
    useEffect(function () { if (!p.open) return; var prev = document.activeElement; if (ref.current) ref.current.focus(); function k(e) { if (e.key === 'Escape' && p.onClose) p.onClose(); } document.addEventListener('keydown', k); return function () { document.removeEventListener('keydown', k); if (prev && prev.focus) prev.focus(); }; }, [p.open]);
    if (!p.open) return null;
    return h('div', { className: cx('sh-sheet-wrap', mode(p.mode)) }, h('div', { className: 'sh-scrim', onClick: p.onClose }),
      h('div', { className: 'sh-sheet', role: 'dialog', 'aria-modal': true, 'aria-label': p.title, tabIndex: -1, ref: ref }, h('span', { className: 'sh-sheet-handle', 'aria-hidden': true }),
        h('div', { className: 'sh-sheet-head' }, h('h2', { className: 'h3' }, p.title), h(IconButton, { icon: 'x', label: p.closeLabel || 'Close', onClick: p.onClose, size: 'sm' })), h('div', { className: 'sh-sheet-body' }, p.children)));
  }
  function DataTable(p) {
    return h('div', { className: cx('sh-table-wrap', mode(p.mode)) }, h('table', { className: 'sh-table body-sm' }, p.caption ? h('caption', { className: 'sr-only' }, p.caption) : null,
      h('thead', null, h('tr', null, (p.columns || []).map(function (c) { return h('th', { key: c.key, scope: 'col', className: c.align === 'right' ? 'is-right' : '' }, c.label); }))),
      h('tbody', null, (p.rows || []).map(function (r, i) { return h('tr', { key: i }, (p.columns || []).map(function (c) { return h('td', { key: c.key, 'data-label': c.label, className: c.align === 'right' ? 'is-right' : '' }, r[c.key]); })); }))));
  }

  /* ---------- Layout & app ---------- */
  function Grid(p) { return h('div', { className: cx('sh-grid', 'is-' + (p.cols || 'cards'), p.className), role: p.list ? 'list' : undefined }, p.children); }
  function Split(p) { return h('div', { className: cx('sh-split', p.reverse && 'is-reverse') }, h('div', { className: 'sh-split-main' }, p.children), h('div', { className: 'sh-split-aside' }, p.aside)); }
  function AppBar(p) {
    return h('div', { className: 'sh-appbar' }, p.left, h('div', { className: 'sh-appbar-text' }, p.eyebrow ? h('p', { className: 'body-sm sh-muted' }, p.eyebrow) : null, h('h1', { className: 'h2' }, p.title)), h('div', { className: 'sh-appbar-end' }, p.right));
  }
  function WeatherCard(p) {
    return h('section', { className: 'sh-weather tone-sky' }, h('div', { className: 'sh-weather-text' }, h('p', { className: 'label' }, p.condition), h('p', { className: 'temp-xl' }, p.temp, h('span', { className: 'h2' }, '°C')), h('p', { className: 'body-sm sh-muted' }, p.range), p.action),
      p.art ? h('div', { className: 'sh-weather-art', 'aria-hidden': true }, p.art) : null);
  }

  function Combobox(p) {
    var auto = useId(); var id = p.id || auto;
    return h('div', { className: 'sh-combo sh-field' }, p.label ? h('label', { htmlFor: id, className: 'label sh-field-label' }, p.label) : null,
      h('div', { className: 'sh-input-wrap has-icon' }, h(Icon, { name: p.icon || 'search', size: 20 }), h('input', { id: id, role: 'combobox', 'aria-expanded': !!p.open, 'aria-controls': id + '-list', 'aria-autocomplete': 'list', className: 'sh-input body', placeholder: p.placeholder, value: p.value, defaultValue: p.defaultValue, onChange: p.onChange })),
      p.open ? h('ul', { id: id + '-list', role: 'listbox', className: 'sh-combo-list' }, (p.options || []).length ? p.options.map(function (o) { return h('li', { key: o.value, role: 'option', 'aria-selected': o.value === p.selected, className: cx('sh-combo-opt', o.value === p.selected && 'is-on'), onClick: function () { p.onSelect && p.onSelect(o); } }, h('span', { className: 'label' }, o.label), o.hint ? h('span', { className: 'body-sm sh-muted' }, o.hint) : null); }) : h('li', { className: 'sh-combo-empty body-sm sh-muted' }, p.emptyText || 'Нічого не знайдено')) : null);
  }
  function Lightbox(p) {
    var ref = useRef(null);
    useEffect(function () { if (!p.open) return; var prev = document.activeElement; if (ref.current) ref.current.focus(); function k(e) { if (e.key === 'Escape' && p.onClose) p.onClose(); if (e.key === 'ArrowLeft' && p.onPrev) p.onPrev(); if (e.key === 'ArrowRight' && p.onNext) p.onNext(); } document.addEventListener('keydown', k); return function () { document.removeEventListener('keydown', k); if (prev && prev.focus) prev.focus(); }; }, [p.open]);
    if (!p.open) return null;
    return h('div', { className: 'sh-lightbox', role: 'dialog', 'aria-modal': true, 'aria-label': p.caption || p.closeLabel || 'Photo', tabIndex: -1, ref: ref },
      h('div', { className: 'sh-lightbox-bar' }, h('span', { className: 'body-sm' }, p.caption), h(IconButton, { icon: 'x', label: p.closeLabel || 'Close', onClick: p.onClose, variant: 'solid' })),
      h('div', { className: 'sh-lightbox-stage' }, p.onPrev ? h(IconButton, { icon: 'chevron-left', label: p.prevLabel || 'Previous', onClick: p.onPrev }) : null, h('div', { className: 'sh-lightbox-img' }, p.children), p.onNext ? h(IconButton, { icon: 'chevron-right', label: p.nextLabel || 'Next', onClick: p.onNext }) : null));
  }
  function BarChart(p) {
    var data = p.data || [], max = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1])), H = p.height || 180, bw = 100 / data.length;
    return h('figure', { className: 'sh-chart' }, p.title ? h('figcaption', { className: 'label' }, p.title) : null,
      h('svg', { viewBox: '0 0 ' + (data.length * 40) + ' ' + (H + 36), className: 'sh-chart-svg', role: 'img', 'aria-label': (p.title || '') + ': ' + data.map(function (d) { return d.label + ' ' + d.value; }).join(', ') },
        data.map(function (d, i) { var bh = Math.round(d.value / max * H); return h('g', { key: i }, h('rect', { x: i * 40 + 8, y: H - bh + 14, width: 24, height: bh, rx: 8, className: 'sh-chart-bar' }), h('text', { x: i * 40 + 20, y: H - bh + 8, textAnchor: 'middle', className: 'sh-chart-val' }, d.value), h('text', { x: i * 40 + 20, y: H + 30, textAnchor: 'middle', className: 'sh-chart-lab' }, d.label)); })));
  }
  function Dots(p) {
    return h('div', { className: 'sh-dots', role: 'img', 'aria-label': (p.current + 1) + ' / ' + p.count }, Array.apply(null, Array(p.count)).map(function (_, i) { return h('span', { key: i, className: cx('sh-dot', i === p.current && 'is-on') }); }));
  }

  Object.assign(SH, { Icon: Icon, Container: Container, Section: Section, Button: Button, IconButton: IconButton, Chip: Chip, Badge: Badge, Input: Input, SearchField: SearchField, Select: Select, Checkbox: Checkbox, Switch: Switch, RadioCard: RadioCard, QuantityStepper: QuantityStepper, SegmentedControl: SegmentedControl, Header: Header, TabBar: TabBar, Breadcrumbs: Breadcrumbs, DateStrip: DateStrip, Footer: Footer, PotIllustration: PotIllustration, Rating: Rating, Price: Price, PlantCard: PlantCard, ProductCard: ProductCard, FactTile: FactTile, ProgressBar: ProgressBar, TaskCard: TaskCard, StatTile: StatTile, Accordion: Accordion, ReviewCard: ReviewCard, GaugeBar: GaugeBar, PlantHero: PlantHero, ScanFrame: ScanFrame, QrLabel: QrLabel, CartItem: CartItem, OrderSummary: OrderSummary, Steps: Steps, Timeline: Timeline, Alert: Alert, Toast: Toast, EmptyState: EmptyState, Skeleton: Skeleton, Sheet: Sheet, DataTable: DataTable, Grid: Grid, Split: Split, AppBar: AppBar, WeatherCard: WeatherCard, Combobox: Combobox, Lightbox: Lightbox, BarChart: BarChart, Dots: Dots });
}
export const Icon = SH.Icon;
export const Container = SH.Container;
export const Section = SH.Section;
export const Button = SH.Button;
export const IconButton = SH.IconButton;
export const Chip = SH.Chip;
export const Badge = SH.Badge;
export const Input = SH.Input;
export const SearchField = SH.SearchField;
export const Select = SH.Select;
export const Checkbox = SH.Checkbox;
export const Switch = SH.Switch;
export const RadioCard = SH.RadioCard;
export const QuantityStepper = SH.QuantityStepper;
export const SegmentedControl = SH.SegmentedControl;
export const Header = SH.Header;
export const TabBar = SH.TabBar;
export const Breadcrumbs = SH.Breadcrumbs;
export const DateStrip = SH.DateStrip;
export const Footer = SH.Footer;
export const PotIllustration = SH.PotIllustration;
export const Rating = SH.Rating;
export const Price = SH.Price;
export const PlantCard = SH.PlantCard;
export const ProductCard = SH.ProductCard;
export const FactTile = SH.FactTile;
export const ProgressBar = SH.ProgressBar;
export const TaskCard = SH.TaskCard;
export const StatTile = SH.StatTile;
export const Accordion = SH.Accordion;
export const ReviewCard = SH.ReviewCard;
export const GaugeBar = SH.GaugeBar;
export const PlantHero = SH.PlantHero;
export const ScanFrame = SH.ScanFrame;
export const QrLabel = SH.QrLabel;
export const CartItem = SH.CartItem;
export const OrderSummary = SH.OrderSummary;
export const Steps = SH.Steps;
export const Timeline = SH.Timeline;
export const Alert = SH.Alert;
export const Toast = SH.Toast;
export const EmptyState = SH.EmptyState;
export const Skeleton = SH.Skeleton;
export const Sheet = SH.Sheet;
export const DataTable = SH.DataTable;
export const Grid = SH.Grid;
export const Split = SH.Split;
export const AppBar = SH.AppBar;
export const WeatherCard = SH.WeatherCard;
export const Combobox = SH.Combobox;
export const Lightbox = SH.Lightbox;
export const BarChart = SH.BarChart;
export const Dots = SH.Dots;
