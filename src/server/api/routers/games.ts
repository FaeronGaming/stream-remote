import { createClient } from "@supabase/supabase-js";
import { type Database } from "~/utils/database.types";
import { env } from "~/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const supabaseSudoClient = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const gamesRouter = createTRPCRouter({
  list: publicProcedure
    .query(async () => {
      const response = await supabaseSudoClient.from("games").select("id, name");
      return response.data ?? [];
    }),
});
