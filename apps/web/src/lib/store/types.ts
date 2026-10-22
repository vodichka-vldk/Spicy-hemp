import type { Locale } from "../types";

import type { ItemKind, ItemStatus, OrderStatus, ReviewStatus } from "../domain";
export type { OrderStatus };
export type PaymentMethod = "cod" | "stripe" | "liqpay";

export type OrderItem = { slug: string; glaze: string; qty: number; unitMinor: number; title: string };

export type Order = {
  id: string; // human friendly, e.g. SH-20261012-ABCD
  createdAt: string;
  status: OrderStatus;
  locale: Locale;
  currency: "UAH" | "EUR";
  items: OrderItem[];
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  payment: PaymentMethod;
  customer: { name: string; email: string; phone: string };
  shipping: { kind: "np" | "intl"; country: string; city: string; address: string; postcode?: string };
  gift: { isGift: boolean; message?: string };
  note?: string;
  potCodes: string[];
};

export type PotStatus = "planted" | "reserved" | "sold" | "returned";

export type Pot = {
  code: string;
  species: string; // herb slug
  batch: string;
  plantedOn: string; // YYYY-MM-DD
  status: PotStatus;
  orderId?: string;
};

/** A physical basket (several herbs) or single plant with one QR code. */
export type Item = {
  code: string;
  kind: ItemKind;
  product: string; // shop product slug, e.g. "set-tea"
  species: string[]; // herb slugs in the basket
  displayNo: number; // numbered per kind: САД · 001
  batch: string;
  readyOn: string; // YYYY-MM-DD
  status: ItemStatus;
  ownerName?: string; // the name the owner gave the pot
  photoPath?: string;
  orderId?: string;
};

/** A customer review; public only when the author agreed (consentPublic) and an admin approved it. */
export type Review = {
  id: string;
  product: string;
  itemCode?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body?: string;
  authorName?: string;
  locale: Locale;
  photos: string[]; // paths in the public "reviews" bucket
  consentPublic: boolean;
  status: ReviewStatus;
  createdAt: string;
};

export type ScanEvent = {
  id: string;
  ts: string;
  potCode: string | null;
  species: string | null;
  country: string | null;
  device: "mobile" | "tablet" | "desktop";
  os: string;
  referrer: string | null;
  visitor: string; // daily-salted hash
  firstScan: boolean;
  valid: boolean;
};

export interface Store {
  createOrder(order: Order): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  listOrders(): Promise<Order[]>;
  updateOrder(id: string, patch: Partial<Order>): Promise<Order | null>;
  getPot(code: string): Promise<Pot | null>;
  listPots(): Promise<Pot[]>;
  upsertPots(pots: Pot[]): Promise<void>;
  getItem(code: string): Promise<Item | null>;
  listItems(): Promise<Item[]>;
  /** Inserts or updates items; new items get the next display number of their kind. */
  upsertItems(items: Array<Omit<Item, "displayNo"> & { displayNo?: number }>): Promise<void>;
  listReviews(filter?: { product?: string; status?: ReviewStatus }): Promise<Review[]>;
  /** Approving requires consentPublic; the store refuses otherwise. */
  upsertReview(review: Review): Promise<void>;
  logScan(ev: ScanEvent): Promise<void>;
  listScans(sinceIso?: string): Promise<ScanEvent[]>;
  hasScanned(potCode: string, visitor: string): Promise<boolean>;
}
