import { io } from 'socket.io-client';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export function createPartySocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  return io(base, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}

export function joinSlotRoom(socket, startTimeSlotMs) {
  if (!socket || !Number.isFinite(startTimeSlotMs)) return;
  socket.emit('join-slot', { startTimeSlotMs });
}
