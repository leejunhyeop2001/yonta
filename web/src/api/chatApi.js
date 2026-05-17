import api from './axiosInstance';

function wrap(data) {
  return { data: { data, message: 'ok' } };
}

export const getPartyMessages = async (partyId) => {
  const res = await api.get(`/parties/${partyId}/messages`);
  const items = (res.data?.messages ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    senderAlias: m.displayName,
    sentAt: typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
  }));
  return wrap(items);
};

export const sendPartyMessage = async (partyId, content) => {
  const res = await api.post(`/parties/${partyId}/messages`, { content });
  return wrap({
    id: res.data.id,
    content: res.data.content,
    senderAlias: res.data.displayName,
    sentAt: typeof res.data.createdAt === 'string'
      ? res.data.createdAt
      : new Date(res.data.createdAt).toISOString(),
  });
};
