import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "~/utils/api";
import { supabasePublicClient } from "~/utils/supabasePublicClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

type Game = { id: number; name: string; };

const counterChannel = supabasePublicClient.channel("counter").subscribe(status => {
  console.log(`Counter Subscription: ${status}`);
});

function useIsAuthenticated() {
  const { data: sessionData } = useSession();
  return Boolean(sessionData);
}

function Button({ onClick, children } : { onClick: () => void; children: ReactNode; }) {
  return (
    <button
      className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SignInButton() {
  const isAuthenticated = useIsAuthenticated();

  return isAuthenticated ? null : (
    <Button onClick={() => void signIn()}>
      Sign In
    </Button>
  );
}

// function FallenOrderDeathButton({ channel }: { channel : RealtimeChannel | null; }) {
//   const deathIncrement = api.supabase.incrementCounter.useMutation({
//     onSuccess() {
//       console.log('triggering refetch');
//       void channel?.send({ type: "broadcast", event: "fallen order death" });
//     }
//   });

//   return (
//     <Button onClick={() => deathIncrement.mutate({ game: "Jedi Fallen Order Deaths" })}>
//       Fallen Order Death Increment
//     </Button>
//   )
// }

function GamesDropdown({ game }: { game?: Game; games: Game[] }) {
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-16 flex flex-col items-center justify-center bg-white/10 text-4xl text-white hover:cursor-not-allowed">
        {game?.name}
        <ChevronDownIcon className="absolute top-0 right-0 h-16 w-16" />
      </div>
    </>
  );
}

function AddCounter() {
  return (
    <>
      <div className="absolute bottom-0 inset-x-0 h-16 flex flex-col items-center justify-center">
        <PlusCircleIcon className="text-white" />
      </div>
    </>
  );
}

function Controls() {
  const isAuthenticated = useIsAuthenticated();
  const [ game, setGame ] = useState<number>();

  const { data: games } = api.games.list.useQuery(undefined, {
    initialData: [],
    onSuccess(data) {
      if (!game && data.length) {
        setGame(data[0]?.id);
      }
    }
  });

  const selectedGame = games.find(({ id }) => id === game);

  return !isAuthenticated ? null : (
    <>
      <GamesDropdown game={selectedGame} games={games} />
      <AddCounter />
    </>
  );
}

export default function Remote() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <SignInButton />
      <Controls />
    </main>
  )
}
