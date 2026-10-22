/** Admin sign-in: e-mail + password from the environment, session in a signed cookie. Edge- and Node-compatible (WebCrypto only). */

export const SESSION_COOKIE = "sh_admin";
export const HINT_COOKIE = "sh_admin_hint"; // readable by the site so the logo can lead an signed-in admin to /admin; carries no secret
export const SESSION_SECONDS = 60 * 60 * 12;

const enc = new TextEncoder();

const secret = () => process.env.ADMIN_SESSION_SECRET || `sh:${process.env.ADMIN_PASSWORD ?? ""}`;

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

const same = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);
export const adminEmail = () => (process.env.ADMIN_EMAIL ?? process.env.ADMIN_USER ?? "admin").trim().toLowerCase();

/** Constant-time check of the submitted credentials. */
export async function checkCredentials(email: string, password: string): Promise<boolean> {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return false;
  const a = await hmac(`${email.trim().toLowerCase()}\n${password}`);
  const b = await hmac(`${adminEmail()}\n${expectedPassword}`);
  return same(a, b);
}

export async function signSession(now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + SESSION_SECONDS;
  return `${exp}.${await hmac(`session:${exp}`)}`;
}

export async function verifySession(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(now / 1000)) return false;
  return same(sig, await hmac(`session:${exp}`));
}

/** Only same-site relative paths under /admin are allowed as a return address. */
export function safeNext(next: string | null | undefined): string {
  return next && /^\/admin(\/[\w\-./?=&%]*)?$/.test(next) && !next.includes("//") ? next : "/admin";
}
