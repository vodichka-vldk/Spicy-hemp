import { describe, expect, it } from "vitest";
import { ALPHABET, cleanCode, formatCode, isValidCode, makeCode, seeded } from "@/lib/pots";

describe("pot codes", () => {
  it("generates valid 8-char codes without ambiguous characters", () => {
    const rand = seeded(1);
    for (let i = 0; i < 500; i++) {
      const c = makeCode(rand);
      expect(c).toHaveLength(8);
      expect(isValidCode(c)).toBe(true);
      expect(/[01IO]/.test(c)).toBe(false);
      for (const ch of c) expect(ALPHABET.includes(ch)).toBe(true);
    }
  });

  it("detects every single-character typo", () => {
    const c = makeCode(seeded(7));
    for (let i = 0; i < c.length; i++) {
      for (const ch of ALPHABET) {
        if (ch === c[i]) continue;
        const typo = c.slice(0, i) + ch + c.slice(i + 1);
        expect(isValidCode(typo), `${c} -> ${typo}`).toBe(false);
      }
    }
  });

  it("accepts lowercase and separators", () => {
    const c = makeCode(seeded(3));
    expect(isValidCode(formatCode(c).toLowerCase())).toBe(true);
    expect(cleanCode(" ab-cd ")).toBe("ABCD");
  });

  it("rejects wrong lengths and junk", () => {
    expect(isValidCode("")).toBe(false);
    expect(isValidCode("ABC")).toBe(false);
    expect(isValidCode("0000-0000")).toBe(false);
  });

  it("collisions are rare across 5000 codes", () => {
    const rand = seeded(99);
    const s = new Set(Array.from({ length: 5000 }, () => makeCode(rand)));
    expect(s.size).toBeGreaterThan(4990);
  });
});
