import { useEffect, useState } from "react";
import Head from "next/head";
import { getQueryKey } from '@trpc/react-query';
import { api } from "~/utils/api";
import { supabasePublicClient } from "~/utils/supabasePublicClient";
import { useQueryClient } from "@tanstack/react-query";

const channel = supabasePublicClient.channel('counter').subscribe(status => {
  console.log(`Subscription Status: ${status}`);
});

export default function Overlay() {
  const { data: deathCount, refetch } = api.counters.get.useQuery({ game: "Jedi Fallen Order", name: "Deaths" }, { initialData: 0, refetchOnWindowFocus: false });

  useEffect(() => {
    channel.on("broadcast", { event: "fallen order death" }, () => {
      console.log('triggering refetch');
      void refetch();
    });
  }, [refetch]);

  return (
    <>
      <Head>
        <title>Stream Overlay</title>
      </Head>
      <main className="min-h-screen">
        <div className="absolute bottom-0 right-0">Deaths: {deathCount}</div>
      </main>
    </>
  );
}
