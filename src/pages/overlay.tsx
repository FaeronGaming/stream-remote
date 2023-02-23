import { useEffect } from "react";
import Head from "next/head";
import { api } from "~/utils/api";
import { supabasePublicClient } from "~/utils/supabasePublicClient";

const isServer = typeof window === "undefined";
const channel = isServer ? undefined : supabasePublicClient.channel('counter').subscribe(status => {
  console.log(`Subscription Status: ${status}`);
});

function CounterList({ game }: { game?: number; }) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { data: counters } = api.counters.list.useQuery({ game: game! }, {
    enabled: Boolean(game)
  });

  return !counters ? null : (
    <div className="absolute inset-y-0 right-0 w-1/4 py-11">
      <div className="h-full flex flex-col-reverse">
        {counters.map(({ name, count }) => (
          <div key={name}>{name}: {count}</div>
        ))}
      </div>
    </div>
  );
}

export default function Overlay() {
  const trpcUtils = api.useContext();
  const { data: game } = api.games.get.useQuery({ name: "Jedi Fallen Order" }, { refetchOnWindowFocus: false });

  useEffect(() => {
    if (!trpcUtils) return;

    channel?.on("broadcast", { event: "updated" }, () => {
      console.log('triggering refetch');
      void trpcUtils.counters.list.invalidate();
    });
  }, [trpcUtils]);

  return (
    <>
      <Head>
        <title>Stream Overlay</title>
      </Head>
      <main className="min-h-screen font-mono text-3xl">
        <CounterList game={game?.id} />
        {/* <div className="absolute bottom-0 right-0">Deaths: {deathCount}</div> */}
      </main>
    </>
  );
}
