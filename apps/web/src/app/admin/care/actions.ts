"use server";

import { revalidatePath } from "next/cache";
import { OVERRIDES_KEY, ruleFor, type CareOverrides } from "@/lib/care";
import { getHerbs } from "@/lib/content";
import { store } from "@/lib/store";

/** Saves only what differs from the defaults. Empty keeps the default, 0 switches the task off for that herb. */
export async function saveCare(formData: FormData) {
  const overrides: CareOverrides = {};
  for (const h of getHerbs()) {
    for (const task of ["water", "feed"] as const) {
      const raw = String(formData.get(`${task}_${h.slug}`) ?? "").trim();
      if (raw === "") continue;
      const n = Math.round(Number(raw));
      if (!Number.isFinite(n) || n < 0 || n > 365) continue;
      const def = ruleFor(h.slug, task);
      if (n === 0) { (overrides[h.slug] ??= {})[task] = null; continue; }
      if (def && def.everyDays === n) continue;
      (overrides[h.slug] ??= {})[task] = { everyDays: n, monthFrom: def?.monthFrom ?? 1, monthTo: def?.monthTo ?? 12 };
    }
  }
  await store().setSetting(OVERRIDES_KEY, Object.keys(overrides).length ? overrides : null);
  revalidatePath("/admin/care");
}
