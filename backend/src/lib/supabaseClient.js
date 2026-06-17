import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_ANON_KEY;

if (!rawUrl || !rawKey) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not defined in backend/.env. Authentication will fail at runtime.");
}

const supabaseUrl = rawUrl || "https://placeholder-project.supabase.co";
const supabaseKey = rawKey || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);
