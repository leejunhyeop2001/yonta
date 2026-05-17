import { useEffect, useRef } from 'react';
import { createPartySocket, joinSlotRoom } from '../lib/socket';

export function usePartyRealtime(partyId, onUpdate, enabled = true) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !localStorage.getItem('accessToken')) return undefined;

    const socket = createPartySocket();
    if (!socket) return undefined;

    const handler = () => callbackRef.current?.();
    const events = ['PARTY_CREATED', 'PARTY_JOINED', 'PARTY_CANCELLED', 'PARTY_DEPARTED', 'PARTY_FARE_UPDATED'];

    socket.on('connect', () => {
      if (partyId) {
        // 상세 화면에서는 슬롯 room 없이도 이벤트를 받기 위해 폴링과 병행
      }
    });

    events.forEach((ev) => socket.on(ev, handler));

    const pollId = setInterval(() => callbackRef.current?.(), 3000);

    return () => {
      clearInterval(pollId);
      events.forEach((ev) => socket.off(ev, handler));
      socket.disconnect();
    };
  }, [partyId, enabled]);
}

export function useSlotRealtime(startTimeSlotMs, onUpdate, enabled = true) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !Number.isFinite(startTimeSlotMs)) return undefined;
    const socket = createPartySocket();
    if (!socket) return undefined;

    const handler = () => callbackRef.current?.();
    const events = ['PARTY_CREATED', 'PARTY_JOINED', 'PARTY_CANCELLED', 'PARTY_DEPARTED', 'PARTY_FARE_UPDATED'];

    socket.on('connect', () => joinSlotRoom(socket, startTimeSlotMs));
    events.forEach((ev) => socket.on(ev, handler));

    return () => {
      events.forEach((ev) => socket.off(ev, handler));
      socket.disconnect();
    };
  }, [startTimeSlotMs, enabled]);
}
