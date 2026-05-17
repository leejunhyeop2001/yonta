import { useCallback, useEffect, useState } from 'react';
import { getPartyMessages, sendPartyMessage } from '../api/chatApi';

const POLL_MS = 2500;

export function usePartyChat(partyId, enabled = true) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
    const id = setInterval(loadHistory, POLL_MS);
    return () => clearInterval(id);
  }, [partyId, enabled, loadHistory]);

  const sendMessage = async (content) => {
    if (!content.trim() || !partyId) return;
    setSending(true);
    try {
      await sendPartyMessage(partyId, content.trim());
      await loadHistory();
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, sendMessage, loadHistory };
}
