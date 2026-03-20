import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client avec service role (côté serveur uniquement)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
