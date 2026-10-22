"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { HINT_COOKIE, SESSION_COOKIE, SESSION_SECONDS, checkCredentials, safeNext, signSession } from "@/lib/admin-auth";

// Best-effort brake against password guessing (per server instance; the real limit belongs to the hosting WAF).
const attempts = new Map<string, { n: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function login(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const now = Date.now();
  const a = attempts.get(ip);
  if (a && now - a.first < WINDOW_MS && a.n >= MAX_ATTEMPTS) redirect(`/admin/login?error=locked&next=${encodeURIComponent(next)}`);

  const ok = await checkCredentials(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!ok) {
    attempts.set(ip, a && now - a.first < WINDOW_MS ? { n: a.n + 1, first: a.first } : { n: 1, first: now });
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  attempts.delete(ip);
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, await signSession(), { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_SECONDS });
  jar.set(HINT_COOKIE, "1", { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge: SESSION_SECONDS });
  redirect(next);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(HINT_COOKIE);
  redirect("/admin/login");
}
