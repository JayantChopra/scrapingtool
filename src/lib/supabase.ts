import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseClient(
  supabaseUrl?: string,
  supabaseAnonKey?: string
): SupabaseClient {
  const url = supabaseUrl || process.env.SUPABASE_URL;
  const key = supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local or provide them in Settings."
    );
  }

  return createClient(url, key);
}
