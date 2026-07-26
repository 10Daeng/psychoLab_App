import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables");
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SECRET_KEY is not defined in environment variables. Admin operations require this key.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
