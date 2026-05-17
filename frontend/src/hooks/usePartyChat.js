import { useCallback, useEffect, useRef, useState } from 'react';
import { getPartyMessages, sendPartyMessage } from '../api/chatApi';
import {
  createStompClient,
  sendChatMessage,
  subscribePartyChat,
} from '../lib/websocket';

export function usePartyChat(partyId, enabled = true) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const clientRef = useRef(null);
  const subsRef = useRef(null);

  const loadHistory = useCallback(async () => {
    if (!partyId) return;
    setLoading(true);
    try {
      const res = await getPartyMessages(partyId);
      setMessages(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    if (!enabled || !partyId || !localStorage.getItem('accessToken')) return undefined;
    loadHistory();

    const client = createStompClient({
      onConnect: () => {
        subsRef.current = subscribePartyChat(client, partyId, (msg) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        });
      },
    });
    if (!client) return undefined;
    clientRef.current = client;
    client.activate();

    return () => {
      subsRef.current?.unsubscribe();
      client.deactivate();
    };
  }, [partyId, enabled, loadHistory]);

  const sendMessage = async (content) => {
    if (!content.trim() || !partyId) return;
    setSending(true);
    try {
      const client = clientRef.current;
      if (client?.connected) {
        sendChatMessage(client, partyId, content.trim());
      } else {
        await sendPartyMessage(partyId, content.trim());
      }
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendMessage, loadHistory };
}
