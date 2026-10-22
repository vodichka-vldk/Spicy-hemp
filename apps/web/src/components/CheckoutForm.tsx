"use client";

import Link from "next/link";
import { useState } from "react";
import { dict, type DictKey } from "@/lib/i18n";
import { formatMoney, totalsFrom, type Currency } from "@/lib/shop-calc";
import type { Locale } from "@/lib/types";
import type { PaymentMethod } from "@/lib/store/types";
import { useCart } from "./CartProvider";
import { NpPicker } from "./NpPicker";
import type { CatalogItem } from "./CartView";

type Errors = Record<string, string>;
type Props = {
  locale: Locale;
  currency: Currency;
  catalog: Record<string, CatalogItem>;
  methods: { np: PaymentMethod[]; intl: PaymentMethod[] };
};


type FieldProps = { name: string; label: DictKey; locale: Locale; errors: Errors; type?: string; auto?: string; inputMode?: "tel" | "email" | "numeric" | "text" };

function Field({ name, label, locale, errors, type = "text", auto, inputMode }: FieldProps) {
  const e = errors[name];
  const text = e === "invalid_email" ? dict.invalid_email[locale] : e === "invalid_phone" ? dict.invalid_phone[locale] : e ? dict.required[locale] : "";
  return (
    <label className="field">
      <span>{dict[label][locale]} *</span>
      <input id={`f-${name}`} name={name} type={type} autoComplete={auto} inputMode={inputMode} className="input" aria-invalid={e ? true : undefined} aria-describedby={e ? `e-${name}` : undefined} />
      {e && <p id={`e-${name}`} className="err" role="alert">{text}</p>}
    </label>
  );
}

const payLabel: Record<PaymentMethod, DictKey> = { cod: "pay_cod", stripe: "pay_stripe", liqpay: "pay_liqpay" };

export function CheckoutForm({ locale, currency, catalog, methods }: Props) {
  const { lines, ready, clear } = useCart();
  const [kind, setKind] = useState<"np" | "intl">(locale === "uk" ? "np" : "intl");
  const [payment, setPayment] = useState<PaymentMethod | "">("");
  const [gift, setGift] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");

  const valid = lines.filter((l) => catalog[l.slug]);
  const totals = totalsFrom(valid, (s) => catalog[s]?.priceUah, currency, kind);
  const money = (m: number) => formatMoney(m, currency, locale);
  const available = methods[kind];
  const chosen = payment && available.includes(payment) ? payment : available[0] ?? "";

  if (!ready) return <div className="container-x py-16" aria-busy="true" />;
  if (valid.length === 0) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-3xl font-bold">{dict.cart_empty[locale]}</h1>
        <Link href={`/${locale}/shop`} className="btn btn-primary mt-6">{dict.cta_shop[locale]}</Link>
      </div>
    );
  }

  /** Drop a field's error as soon as the user edits it, so fixed fields stop looking broken. */
  function clearError(ev: React.FormEvent<HTMLFormElement>) {
    const name = (ev.target as HTMLInputElement).name;
    if (name && errors[name]) setErrors(({ [name]: _gone, ...rest }) => rest);
  }

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setServerError("");
    const fd = new FormData(ev.currentTarget);
    const g = (k: string) => String(fd.get(k) ?? "");
    const body = {
      locale,
      lines: valid,
      customer: { name: g("name"), email: g("email"), phone: g("phone") },
      shipping: { kind, country: kind === "np" ? "UA" : g("country"), city: g("city"), address: g("address"), postcode: g("postcode"), cityRef: g("cityRef"), warehouseRef: g("warehouseRef") },
      gift: { isGift: gift, message: g("giftMessage") },
      note: g("note"),
      payment: chosen,
      agree: fd.get("agree") === "on",
    };
    setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.status === 422) {
        setErrors(json.errors ?? {});
        const first = Object.keys(json.errors ?? {})[0];
        if (first) document.getElementById(`f-${first}`)?.focus();
        return;
      }
      if (!res.ok) { setServerError(dict.error_t[locale]); return; }
      clear();
      window.location.assign(json.redirect);
    } catch {
      setServerError(dict.error_t[locale]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-x py-8">
      <h1 className="text-4xl font-bold text-leaf">{dict.checkout[locale]}</h1>
      <form onSubmit={submit} onInput={clearError} onChange={clearError} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <fieldset className="card space-y-4 p-5">
            <legend className="px-1 text-xl font-bold">{dict.contacts[locale]}</legend>
            <Field locale={locale} errors={errors} name="name" label="name" auto="name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field locale={locale} errors={errors} name="email" label="email" type="email" auto="email" inputMode="email" />
              <Field locale={locale} errors={errors} name="phone" label="phone" type="tel" auto="tel" inputMode="tel" />
            </div>
          </fieldset>

          <fieldset className="card space-y-4 p-5">
            <legend className="px-1 text-xl font-bold">{dict.delivery[locale]}</legend>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
              {(["np", "intl"] as const).map((k) => (
                <label key={k} className={`card flex cursor-pointer items-center gap-3 p-4 ${kind === k ? "border-leaf ring-2 ring-leaf" : ""}`}>
                  <input type="radio" name="kind" checked={kind === k} onChange={() => { setKind(k); setErrors({}); }} />
                  <span className="font-semibold">{dict[k === "np" ? "ship_np" : "ship_intl"][locale]}</span>
                </label>
              ))}
            </div>
            {kind === "intl" && <Field locale={locale} errors={errors} name="country" label="country" auto="country-name" />}
            {kind === "np" ? <NpPicker locale={locale} errors={errors} /> : (
              <>
                <Field locale={locale} errors={errors} name="city" label="city" auto="address-level2" />
                <Field locale={locale} errors={errors} name="address" label="address" auto="street-address" />
              </>
            )}
            {kind === "intl" && <Field locale={locale} errors={errors} name="postcode" label="postcode" auto="postal-code" />}
          </fieldset>

          <fieldset className="card space-y-4 p-5">
            <legend className="px-1 text-xl font-bold">🎁 {dict.gift[locale]}</legend>
            <label className="flex items-center gap-3"><input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="h-5 w-5" /><span>{dict.gift[locale]}</span></label>
            {gift && (
              <label className="field">
                <span>{dict.gift_msg[locale]}</span>
                <textarea name="giftMessage" rows={3} maxLength={300} className="input" />
                <p className="mt-1 text-sm text-muted">{dict.gift_hide[locale]}</p>
              </label>
            )}
            <label className="field"><span>{dict.note[locale]}</span><textarea name="note" rows={2} maxLength={500} className="input" /></label>
          </fieldset>

          <fieldset className="card space-y-3 p-5">
            <legend className="px-1 text-xl font-bold">{dict.payment[locale]}</legend>
            {available.length === 0 && <p className="text-muted">—</p>}
            {available.map((m) => (
              <label key={m} className={`card flex cursor-pointer items-center gap-3 p-4 ${chosen === m ? "border-leaf ring-2 ring-leaf" : ""}`}>
                <input type="radio" name="payment" checked={chosen === m} onChange={() => setPayment(m)} />
                <span className="font-semibold">{dict[payLabel[m]][locale]}</span>
              </label>
            ))}
            {errors.payment && <p className="err" role="alert">{dict.required[locale]}</p>}
          </fieldset>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-20">
          <ul className="space-y-2 text-sm">
            {valid.map((l) => (
              <li key={`${l.slug}${l.glaze}`} className="flex justify-between gap-3">
                <span>{catalog[l.slug].title} × {l.qty}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4">
            <div className="flex justify-between"><dt>{dict.subtotal[locale]}</dt><dd>{money(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>{dict.shipping[locale]}</dt><dd>{totals.shipping === 0 ? dict.free[locale] : money(totals.shipping)}</dd></div>
            <div className="flex justify-between text-xl font-bold"><dt>{dict.total[locale]}</dt><dd>{money(totals.total)}</dd></div>
          </dl>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input id="f-agree" name="agree" type="checkbox" className="mt-1 h-5 w-5" aria-invalid={errors.agree ? true : undefined} />
            <span>{dict.terms_agree[locale]} (<Link href={`/${locale}/terms`} className="underline">{dict.terms_page[locale]}</Link>)</span>
          </label>
          {errors.agree && <p className="err" role="alert">{dict.required[locale]}</p>}
          {serverError && <p className="err" role="alert">{serverError}</p>}
          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy || available.length === 0}>{busy ? dict.placing[locale] : dict.place_order[locale]}</button>
          <p className="mt-3 text-xs text-muted">{dict.price_note[locale]}</p>
        </aside>
      </form>
    </div>
  );
}
