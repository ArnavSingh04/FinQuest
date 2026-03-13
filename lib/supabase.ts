import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

// Use placeholder values so the app can boot before env vars are configured.
export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key",
);

export const transactionsTableSchema = `
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null,
  category text not null check (category in ('Need', 'Want', 'Treat', 'Invest')),
  created_at timestamptz not null default timezone('utc', now())
);
`;
