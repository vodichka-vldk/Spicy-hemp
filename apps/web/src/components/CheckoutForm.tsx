"use client";

import { useState } from "react";
import { Alert, Button, Checkbox, EmptyState, Input, OrderSummary, RadioCard, Split } from "@/ds";
import { Panel } from "@/ui";
import { dict, type DictKey } from "@/lib/i18n";
import { formatMoney, priceMinor, totalsFrom, type Currency } from "@/lib/shop-calc";
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
  const text = e === "invalid_email" ? dict.invalid_email[locale] : e === "invalid_phone" ? dict.invalid_phone[locale] : e ? dict.required[locale] : undefined;
  return <Input id={`f-${name}`} name={name} type={type} label={`${dict[label][locale]} *`} autoComplete={auto} inputMode={inputMode} error={text} />;
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
      <div className="container-x py-16">
        <EmptyState icon="shopping-cart" title={dict.cart_empty[locale]} action={<Button variant="accent" href={`/${locale}/shop`}>{dict.cta_shop[locale]}</Button>} />
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
    <div className="container-x sh-stack-lg py-8">
      <h1>{dict.checkout[locale]}</h1>
      <form onSubmit={submit} onInput={clearError} onChange={clearError} noValidate>
        <Split
          aside={
            <OrderSummary
              title={dict.cart_title[locale]}
              rows={[
                ...valid.map((l) => ({ label: `${catalog[l.slug].title} × ${l.qty}`, value: money(priceMinor(catalog[l.slug].priceUah, currency) * l.qty) })),
                { label: dict.subtotal[locale], value: money(totals.subtotal) },
                { label: dict.shipping[locale], value: totals.shipping === 0 ? dict.free[locale] : money(totals.shipping) },
              ]}
              note={dict.price_note[locale]}
              totalLabel={dict.total[locale]}
              total={money(totals.total)}
              cta={
                <div className="sh-stack">
                  <Checkbox id="f-agree" name="agree" invalid={Boolean(errors.agree)}>
                    {dict.terms_agree[locale]} (<a href={`/${locale}/terms`} className="underline" target="_blank" rel="noopener noreferrer">{dict.terms_page[locale]}</a>)
                  </Checkbox>
                  {errors.agree && <Alert tone="danger">{dict.required[locale]}</Alert>}
                  {serverError && <Alert tone="danger">{serverError}</Alert>}
                  <Button type="submit" variant="accent" size="lg" full loading={busy} disabled={available.length === 0}>{busy ? dict.placing[locale] : dict.place_order[locale]}</Button>
                </div>
              }
            />
          }
        >
          <div className="sh-stack-lg">
            <Panel title={dict.contacts[locale]}>
              <Field locale={locale} errors={errors} name="name" label="name" auto="name" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field locale={locale} errors={errors} name="email" label="email" type="email" auto="email" inputMode="email" />
                <Field locale={locale} errors={errors} name="phone" label="phone" type="tel" auto="tel" inputMode="tel" />
              </div>
            </Panel>

            <Panel title={dict.delivery[locale]}>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={dict.delivery[locale]}>
                {(["np", "intl"] as const).map((k) => (
                  <RadioCard key={k} name="kind" value={k} icon={k === "np" ? "truck" : "globe"} title={dict[k === "np" ? "ship_np" : "ship_intl"][locale]} checked={kind === k} onChange={() => { setKind(k); setErrors({}); }} />
                ))}
              </div>
              {kind === "intl" && <Field locale={locale} errors={errors} name="country" label="country" auto="country-name" />}
              {kind === "np" ? <NpPicker locale={locale} errors={errors} /> : (
                <>
                  <Field locale={locale} errors={errors} name="city" label="city" auto="address-level2" />
                  <Field locale={locale} errors={errors} name="address" label="address" auto="street-address" />
                  <Field locale={locale} errors={errors} name="postcode" label="postcode" auto="postal-code" />
                </>
              )}
            </Panel>

            <Panel title={dict.gift[locale]}>
              <Checkbox checked={gift} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGift(e.target.checked)}>{dict.gift[locale]}</Checkbox>
              {gift && <Input name="giftMessage" label={dict.gift_msg[locale]} hint={dict.gift_hide[locale]} multiline rows={3} maxLength={300} />}
              <Input name="note" label={dict.note[locale]} multiline rows={2} maxLength={500} />
            </Panel>

            <Panel title={dict.payment[locale]}>
              {available.length === 0 && <p className="sh-muted">—</p>}
              <div className="sh-stack" role="radiogroup" aria-label={dict.payment[locale]}>
                {available.map((m) => (
                  <RadioCard key={m} name="payment" value={m} icon={m === "cod" ? "package" : "credit-card"} title={dict[payLabel[m]][locale]} checked={chosen === m} onChange={() => setPayment(m)} />
                ))}
              </div>
              {errors.payment && <Alert tone="danger">{dict.required[locale]}</Alert>}
            </Panel>
          </div>
        </Split>
      </form>
    </div>
  );
}
