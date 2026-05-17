import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_BASE = import.meta.env.VITE_WS_BASE_URL
  || import.meta.env.VITE_API_BASE_URL
  || 'http://localhost:8080';

export function createStompClient({ onConnect, onDisconnect, onError } = {}) {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect,
    onDisconnect,
    onStompError: (frame) => {
      onError?.(frame);
    },
  });

  return client;
}

export function subscribePartyChat(client, partyId, onMessage) {
  return client.subscribe(`/topic/party.${partyId}.chat`, (frame) => {
    onMessage(JSON.parse(frame.body));
  });
}

export function subscribePartyUpdate(client, partyId, onUpdate) {
  return client.subscribe(`/topic/party.${partyId}.update`, (frame) => {
    onUpdate(JSON.parse(frame.body));
  });
}

export function subscribeNotifications(client, onNotification) {
  return client.subscribe('/user/queue/notifications', (frame) => {
    onNotification(JSON.parse(frame.body));
  });
}

export function sendChatMessage(client, partyId, content) {
  client.publish({
    destination: `/app/party.${partyId}.chat`,
    body: JSON.stringify({ content }),
  });
}
