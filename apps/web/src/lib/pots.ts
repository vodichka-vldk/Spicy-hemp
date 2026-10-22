// Pot codes: 7 random characters + 1 check character, alphabet without 0/1/I/O.
export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const weights = [3, 5, 7, 11, 13, 17, 19];

function checkChar(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += ALPHABET.indexOf(body[i]) * weights[i % weights.length];
  return ALPHABET[sum % ALPHABET.length];
}

export function makeCode(rand: () => number = Math.random): string {
  let body = "";
  for (let i = 0; i < 7; i++) body += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return body + checkChar(body);
}

export function isValidCode(raw: string): boolean {
  const code = raw.toUpperCase().replace(/[\s\-_]/g, "");
  if (code.length !== 8) return false;
  for (const ch of code) if (!ALPHABET.includes(ch)) return false;
  return checkChar(code.slice(0, 7)) === code[7];
}

export const cleanCode = (raw: string) => raw.toUpperCase().replace(/[\s\-_]/g, "");
export const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

/** Deterministic PRNG (mulberry32) so demo data is stable between runs. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
