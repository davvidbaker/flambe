/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react';
import { createActor } from 'xstate';

function useMachine(machine, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const actorRef = useRef(null);
  if (!actorRef.current) {
    actorRef.current = createActor(machine, { input: options.input });
  }
  const [current, setCurrent] = useState(actorRef.current.getSnapshot());

  useEffect(() => {
    const actor = actorRef.current;
    const subscription = actor.subscribe(state => {
      const currentOptions = optionsRef.current;
      currentOptions.log && console.log('CONTEXT:', state.context);
      currentOptions.log && console.log('STATE', state.value);
      setCurrent(state);
    });
    actor.start();
    setCurrent(actor.getSnapshot());

    return () => {
      subscription.unsubscribe();
      actor.stop();
    };
  }, []);

  return [current, event => actorRef.current.send(event)];
}

export default useMachine;
