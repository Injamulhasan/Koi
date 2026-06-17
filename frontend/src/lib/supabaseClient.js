import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawUrl || !rawAnonKey) {
  console.warn("WARNING: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined in frontend/.env. Authentication will fail at runtime.");
}

const supabaseUrl = rawUrl || "https://placeholder-project.supabase.co";
const supabaseAnonKey = rawAnonKey || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
