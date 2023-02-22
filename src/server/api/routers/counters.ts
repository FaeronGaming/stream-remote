import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { type Database } from "~/utils/database.types";
import { env } from "~/env.mjs";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const supabaseSudoClient = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function getGameIdFromName(gameName: string) {
  const { data: gameData } = await supabaseSudoClient.from("games")
    .select()
    .eq("name", gameName)
    .single();

  if (!gameData) {
    throw new Error(`Game ${gameName} doesn't exist`);
  }

  return gameData.id;
}

export const countersRouter = createTRPCRouter({
  getSingleCounter: publicProcedure
    .input(z.object({ game: z.string(), name: z.string() }))
    .query(async ({ input }) => {
      const gameId = await getGameIdFromName(input.game);

      const { data } = await supabaseSudoClient.from("counters")
        .select()
        .eq("name", input.name)
        .eq("game", gameId)
        .maybeSingle();

      return data?.count ?? 0;
    }),

  getAllForGame: publicProcedure
    .input(z.object({ game: z.string() }))
    .query(async ({ input }) => {
      const gameId = await getGameIdFromName(input.game);
      const { data } = await supabaseSudoClient.from("counters")
        .select("name, count")
        .eq("game", gameId);

      return data ?? [];
    }),

  add: protectedProcedure
    .input(z.object({ game: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      const gameId = await getGameIdFromName(input.game);
    }),

  increment: protectedProcedure
    .input(z.object({ game: z.string(), name: z.string() }))
    .mutation(async ({ input }) => {
      const gameId = await getGameIdFromName(input.game);

      const response = await supabaseSudoClient.from("counters")
        .select()
        .eq("name", input.name)
        .eq("game", gameId)
        .maybeSingle();

      if (!response.data) {
        await supabaseSudoClient.from("counters").insert({ name: input.name, game: gameId, count: 1 });
        return;
      }

      const count = response.data.count;
      const newCount = count + 1;
      await supabaseSudoClient.from("counters").upsert({
        count: newCount,
        name: input.name,
        game: gameId,
        id: response.data.id
      });
    }),
});

