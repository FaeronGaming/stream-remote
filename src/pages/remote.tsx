import { useSession, signIn } from "next-auth/react";
import { forwardRef, useCallback, useEffect, useState, type ReactNode } from "react";
import { api } from "~/utils/api";
import { supabasePublicClient } from "~/utils/supabasePublicClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useFloating, useClick } from "@floating-ui/react";
import {
  FloatingFocusManager,
  FloatingOverlay,
  useDismiss,
  useInteractions,
  useRole
} from "@floating-ui/react";

type Game = { id: number; name: string; };
type Counter = { name: string; count: number; };

const isBrowser = typeof window !== "undefined";
const counterChannel =  isBrowser && supabasePublicClient.channel("counter").subscribe(status => {
  console.log(`Counter Subscription: ${status}`);
});

function useIsAuthenticated() {
  const { data: sessionData } = useSession();
  return Boolean(sessionData);
}

const noop = () => {
  // noop
};

type ButtonProps = {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function ButtonInner({
  onClick = noop,
  children,
  className = '',
  disabled = false,
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      className={`rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20 ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
})

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
      <div className="absolute inset-x-0 top-0 h-16 flex flex-col items-center justify-center bg-white/10 text-3xl text-white hover:cursor-not-allowed">
        {game?.name}
        <ChevronDownIcon className="absolute top-0 right-0 h-16 w-16" />
      </div>
    </>
  );
}

function AddCounter({ game }: { game: Game; }) {
  const trpcUtils = api.useContext();
  const [isOpen, setIsOpen] = useState(false);
  const [counterName, setCounterName] = useState<string>();
  const {refs, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown"
  });
  const role = useRole(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss, role]);

  const addCounterMutation = api.counters.add.useMutation({
    onSuccess() {
      setCounterName('');
      setIsOpen(false);
      void trpcUtils.counters.list.invalidate()
    },
    onError() {
      console.log('foobar');
    }
  });

  const addCounter = useCallback((counterName: string | undefined) => {
    console.log({ counterName, game })
    if (!counterName || !game) return;
    addCounterMutation.mutate({ name: counterName, game: game.id})
  }, [addCounterMutation, game]);

  return (
    <>
      <div className="absolute bottom-0 inset-x-0 h-16 flex flex-col items-center justify-center">
        {/* <PlusCircleIcon className="text-white" ref={refs.setReference} {...getReferenceProps()} /> */}
        <Button ref={refs.setReference} {...getReferenceProps()}>Add Counter</Button>
      </div>
      {isOpen && (
        <FloatingOverlay
          lockScroll
          style={{background: 'rgba(156, 163, 175, 0.15'}}
          className="flex items-center justify-center"
        >
          <FloatingFocusManager context={context}>
            <div
              ref={refs.setFloating}
              {...getFloatingProps()}
              className="flex flex-col p-4 rounded-lg bg-slate-800"
            >
              <h2 className="text-white text-center">New Counter</h2>
              <input
                onChange={({ target }) => setCounterName(target.value)}
                className="my-3 rounded-lg shadow-sm focus:border-indigo-900 focus:ring-indigo-900 focus-visible:border-indigo-900 focus-visible:ring-indigo-900"
                autoFocus
              />
              <Button
                disabled={!Boolean(counterName)}
                className="mt-5"
                onClick={() => addCounter(counterName)}
              >
                Add
              </Button>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </>
  );
}

function CounterControl({ counter, game }: { counter: Counter; game: Game; }) {
  const [isOpen, setIsOpen] = useState(false);
  const trpcUtils = api.useContext();
  const {refs, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown"
  });
  const role = useRole(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([click, dismiss, role]);
  const deleteCounterMutation = api.counters.delete.useMutation({
    onSuccess() {
      void trpcUtils.counters.list.invalidate();
    }
  });

  return (
    <>
      <div className="text-white text-3xl flex flex-row w-full justify-between">
        <div className="flex flex-row items-center gap-x-2">
          <XCircleIcon className="h-7" ref={refs.setReference} {...getReferenceProps()} />
          {counter.name}
        </div>
        <div className="flex flex-row items-center gap-x-2">
          <PlusCircleIcon className="h-7" />
          {counter.count}
          <MinusCircleIcon className="h-7" />
        </div>
      </div>
      {isOpen && (
        <FloatingOverlay
          lockScroll
          style={{background: 'rgba(156, 163, 175, 0.15'}}
          className="flex items-center justify-center"
        >
          <FloatingFocusManager context={context}>
            <div
              ref={refs.setFloating}
              {...getFloatingProps()}
              className="flex flex-col p-4 rounded-lg bg-slate-800"
            >
              <h2 className="text-white text-center">Are you sure you want to delete {counter.name}?</h2>
              <div className="flex flex-row w-full justify-between mt-10">
                <Button onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button
                  className="bg-red-900"
                  onClick={() => deleteCounterMutation.mutate({ name: counter.name, game: game.id })}
                >
                  Delete
                </Button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      )}
    </>
  );
}

function CountersList({ counters, game }: { counters: Counter[]; game: Game; }) {
  return (
    <div className="flex mt-16 p-5 flex-col items-start inset-0">
      {counters?.map(counter => (
        <CounterControl
          key={counter.name}
          counter={counter}
          game={game}
        />
      ))}
    </div>
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { data: counters } = api.counters.list.useQuery({ game: game! }, {
    enabled: Boolean(game),
    initialData: [],
  });

  const selectedGame = games.find(({ id }) => id === game);

  return !isAuthenticated ? null : (
    <>
      <GamesDropdown game={selectedGame} games={games} />
      {selectedGame && <CountersList counters={counters} game={selectedGame} />}
      {selectedGame && <AddCounter game={selectedGame} />}
    </>
  );
}

export default function Remote() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <SignInButton />
      <Controls />
    </main>
  )
}
