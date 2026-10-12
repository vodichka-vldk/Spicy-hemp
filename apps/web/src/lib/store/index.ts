import { fileStore } from "./file";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export const usingSupabase = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const store = (): Store => (usingSupabase() ? supabaseStore : fileStore);
export * from "./types";
