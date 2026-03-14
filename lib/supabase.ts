const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isPlaceholderValue(value: string | undefined) {
  if (!value) {
    return true;
  }

  return (
    value.includes("your-project") ||
    value.includes("your-anon-key") ||
    value.includes("placeholder")
  );
}

export const hasSupabaseEnv = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !isPlaceholderValue(supabaseUrl) &&
    !isPlaceholderValue(supabaseAnonKey),
);

export const supabaseConfig = {
  url: supabaseUrl ?? "https://placeholder.supabase.co",
  anonKey: supabaseAnonKey ?? "placeholder-anon-key",
};

export const schemaPath = "supabase/schema.sql";
