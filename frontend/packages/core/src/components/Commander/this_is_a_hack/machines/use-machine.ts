/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react';
import { createActor } from 'xstate';
import type {
  AnyActorLogic,
  ActorRefFromLogic,
  EventFromLogic,
  InputFrom,
  SnapshotFrom,
} from 'xstate';

interface Options<TMachine extends AnyActorLogic> {
  input?: InputFrom<TMachine>;
  log?: boolean;
}

function useMachine<TMachine extends AnyActorLogic>(
  machine: TMachine,
  options: Options<TMachine> = {},
): [SnapshotFrom<TMachine>, (event: EventFromLogic<TMachine>) => void] {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const actorRef = useRef<ActorRefFromLogic<TMachine> | null>(null);
  if (!actorRef.current) {
    actorRef.current = createActor(machine, { input: options.input }) as ActorRefFromLogic<TMachine>;
  }
  const initialActor = actorRef.current;
  const [current, setCurrent] = useState(initialActor.getSnapshot());

  useEffect(() => {
    const actor = actorRef.current!;
    const subscription = actor.subscribe(state => {
      const currentOptions = optionsRef.current;
      currentOptions.log && console.log('STATE', state);
      setCurrent(state);
    });
    actor.start();
    setCurrent(actor.getSnapshot());

    return () => {
      subscription.unsubscribe();
      actor.stop();
    };
  }, []);

  return [current, event => actorRef.current?.send(event)];
}

export default useMachine;
