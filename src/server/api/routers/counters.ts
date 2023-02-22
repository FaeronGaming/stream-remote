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

function incrementFactory(amount: number) {
  return async ({ input }: { input: { game: number; name: string; }; }) => {
    const response = await supabaseSudoClient.from("counters")
      .select()
      .eq("name", input.name)
      .eq("game", input.game)
      .maybeSingle();

    if (!response.data) {
      throw new Error(`Counter ${input.name} does not exist for game ${input.game}`);
    }

    const count = response.data.count;
    const newCount = count + amount;

    // prevent going lower than 0
    if (newCount < 0) return;

    await supabaseSudoClient.from("counters").upsert({
      count: newCount,
      name: input.name,
      game: input.game,
      id: response.data.id
    });
  };
}

export const countersRouter = createTRPCRouter({
  get: publicProcedure
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

  list: publicProcedure
    .input(z.object({ game: z.number() }))
    .query(async ({ input }) => {
      const { data } = await supabaseSudoClient.from("counters")
        .select("name, count")
        .eq("game", input.game);

      return data ?? [];
    }),

  add: protectedProcedure
    .input(z.object({ game: z.number(), name: z.string() }))
    .mutation(async ({ input }) => {
      const { data } = await supabaseSudoClient.from("counters")
        .select()
        .eq("name", input.name)
        .eq("game", input.game)
        .maybeSingle();

      if (data) {
        throw new Error(`${input.name} already exists for game ${input.game}`);
      }

      await supabaseSudoClient.from("counters")
        .insert({ game: input.game, name: input.name, count: 0 });
    }),

  delete: protectedProcedure
    .input(z.object({ game: z.number(), name: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseSudoClient.from("counters")
        .delete()
        .eq("name", input.name)
        .eq("game", input.game);

      if (error) {
        throw error;
      }
    }),

  increment: protectedProcedure
    .input(z.object({ game: z.number(), name: z.string() }))
    .mutation(incrementFactory(1)),

  decrement: protectedProcedure
    .input(z.object({ game: z.number(), name: z.string() }))
    .mutation(incrementFactory(-1)),
});
