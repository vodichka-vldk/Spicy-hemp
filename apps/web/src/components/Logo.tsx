"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Site logo. For a signed-in admin (non-secret hint cookie) it leads to the admin; everyone else goes home. */
export function Logo({ home, label, children }: { home: string; label: string; children: React.ReactNode }) {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    try { setAdmin(document.cookie.split("; ").some((c) => c === "sh_admin_hint=1")); } catch { /* cookies blocked: stay on the public link */ }
  }, []);
  return (
    <Link href={admin ? "/admin" : home} prefetch={false} className="font-display text-xl font-bold text-leaf no-underline" aria-label={admin ? "Адмінка" : label}>
      {children}
    </Link>
  );
}
