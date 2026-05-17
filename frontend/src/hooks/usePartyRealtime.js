import { useEffect, useRef } from 'react';
import { createStompClient, subscribePartyUpdate } from '../lib/websocket';

export function usePartyRealtime(partyId, onUpdate, enabled = true) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !partyId || !localStorage.getItem('accessToken')) return undefined;

    let subscription;
    const client = createStompClient({
      onConnect: () => {
        subscription = subscribePartyUpdate(client, partyId, (event) => {
          callbackRef.current?.(event);
        });
      },
    });
    if (!client) return undefined;
    client.activate();

    return () => {
      subscription?.unsubscribe();
      client.deactivate();
    };
  }, [partyId, enabled]);
}
