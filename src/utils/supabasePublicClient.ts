import { createClient } from "@supabase/supabase-js";
import { type Database } from "./database.types";
import { env } from "~/env.mjs";

export const supabasePublicClient = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
