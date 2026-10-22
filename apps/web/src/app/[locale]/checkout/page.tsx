import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { catalogFor } from "@/lib/catalog";
import { isLocale, t } from "@/lib/i18n";
import { paymentMethodsFor } from "@/lib/orders";
import { currencyFor } from "@/lib/shop";

export const dynamic = "force-dynamic"; // payment methods depend on server env

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: t(locale, "checkout"), robots: { index: false } } : {};
}

export default async function Checkout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const currency = currencyFor(locale);
  return (
    <CheckoutForm
      locale={locale}
      currency={currency}
      catalog={catalogFor(locale)}
      methods={{ np: paymentMethodsFor({ shippingKind: "np", currency }), intl: paymentMethodsFor({ shippingKind: "intl", currency }) }}
    />
  );
}
