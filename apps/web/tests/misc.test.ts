import { describe, expect, it } from "vitest";
import { parseUa, visitorHash } from "@/lib/analytics";
import { herbMatches, getHerb } from "@/lib/content";
import { detectLocale } from "@/lib/i18n";
import { wateringIcs } from "@/lib/ics";
import { orderStats, scanStats } from "@/lib/stats";
import type { ScanEvent } from "@/lib/store/types";

describe("locale detection", () => {
  it("prefers the highest-q supported language", () => {
    expect(detectLocale("en-US,en;q=0.9,uk;q=0.8")).toBe("en");
    expect(detectLocale("uk-UA,uk;q=0.9")).toBe("uk");
    expect(detectLocale("ru-RU,ru;q=0.9")).toBe("uk");
    expect(detectLocale("de-DE,de;q=0.9,en;q=0.5")).toBe("en");
    expect(detectLocale("fr")).toBe("uk");
    expect(detectLocale(null)).toBe("uk");
  });
});

describe("search", () => {
  it("finds herbs by Ukrainian, English, Latin and variety names, ignoring accents and apostrophes", () => {
    const mint = getHerb("mint")!;
    expect(herbMatches(mint, "м'ята")).toBe(true);
    expect(herbMatches(mint, "мята")).toBe(true); // typing without the apostrophe still finds it
    expect(herbMatches(mint, "MINT")).toBe(true);
    expect(herbMatches(mint, "mentha")).toBe(true);
    expect(herbMatches(mint, "mitcham")).toBe(true);
    expect(herbMatches(mint, "xyz")).toBe(false);
    expect(herbMatches(mint, "")).toBe(true);
  });
});

describe("ics", () => {
  it("builds a valid recurring event with CRLF line endings", () => {
    const ics = wateringIcs({ title: "Water, basil", description: "a;b", everyDays: 2, uid: "x@y", start: new Date("2026-10-13T00:00:00Z") });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("RRULE:FREQ=DAILY;INTERVAL=2");
    expect(ics).toContain("SUMMARY:Water\\, basil");
    expect(ics).toContain("DESCRIPTION:a\;b");
    expect(ics).toContain("DTSTART:20261013T080000Z");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});

describe("analytics helpers", () => {
  it("hashes visitors per day and never contains the IP", () => {
    const a = visitorHash("1.2.3.4", "UA", new Date("2026-10-12T00:00:00Z"));
    const b = visitorHash("1.2.3.4", "UA", new Date("2026-10-13T00:00:00Z"));
    expect(a).not.toBe(b);
    expect(a).not.toContain("1.2.3.4");
    expect(a).toHaveLength(16);
  });

  it("parses device and OS", () => {
    expect(parseUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile")).toEqual({ device: "mobile", os: "iOS" });
    expect(parseUa("Mozilla/5.0 (Linux; Android 14) Mobile")).toEqual({ device: "mobile", os: "Android" });
    expect(parseUa("Mozilla/5.0 (Windows NT 10.0)").device).toBe("desktop");
  });

  const ev = (o: Partial<ScanEvent>): ScanEvent => ({ id: "1", ts: "2026-10-10T10:00:00Z", potCode: "AAAA", species: "basil", country: "UA", device: "mobile", os: "iOS", referrer: null, visitor: "v1", firstScan: true, valid: true, ...o });

  it("aggregates scans", () => {
    const now = new Date("2026-10-12T12:00:00Z");
    const s = scanStats([ev({}), ev({ id: "2", visitor: "v2", firstScan: false }), ev({ id: "3", potCode: "BBBB", species: "mint", country: "PL" }), ev({ id: "4", valid: false }), ev({ id: "5", ts: "2026-01-01T00:00:00Z" })], 30, now);
    expect(s.total).toBe(3);
    expect(s.invalid).toBe(1);
    expect(s.uniqueVisitors).toBe(2);
    expect(s.scannedPots).toBe(2);
    expect(s.repeatPots).toBe(1);
    expect(s.bySpecies[0]).toEqual({ key: "basil", n: 2 });
    expect(s.perDay).toHaveLength(30);
  });

  it("sums revenue per currency, excluding cancelled orders", () => {
    const base = { totalMinor: 1000, status: "new", currency: "UAH" } as never;
    const o = orderStats([{ ...(base as object), id: "a" }, { ...(base as object), id: "b", status: "cancelled" }, { ...(base as object), id: "c", currency: "EUR" }] as never);
    expect(o.count).toBe(3);
    expect(o.revenue).toEqual({ UAH: 1000, EUR: 1000 });
  });
});
