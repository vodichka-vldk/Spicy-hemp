export type Locale = "uk" | "en";
export type L = Record<Locale, string>;

export type Problem = { symptom: L; fix: L };
export type Variety = { name: string; note: L };

export type Herb = {
  slug: string;
  latin: string;
  family: string;
  names: L;
  tagline: L;
  color: string; // accent colour used for the illustration
  cycle: "annual" | "biennial" | "perennial" | "shrub" | "tree" | "tropical";
  difficulty: 1 | 2 | 3;
  light: { hours: string; level: "sun" | "bright" | "partial" };
  waterEveryDays: number; // reminder cadence
  waterNote: L;
  temp: [number, number];
  humidity: "low" | "medium" | "high";
  potCm: number;
  petSafe: "safe" | "caution" | "unknown";
  varieties: Variety[];
  sections: { light: L; water: L; feeding: L; harvest: L; winter: L; uses: L };
  problems: Problem[];
  companions: string[];
  aloneInPot?: boolean;
  priceUah: number; // placeholder prices
};

export type Family = {
  slug: string;
  latin: string;
  names: L;
  description: L;
};
