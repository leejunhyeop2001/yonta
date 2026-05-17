import api from './axiosInstance';

export const getPartyMessages = (partyId) =>
  api.get(`/api/parties/${partyId}/messages`);

export const sendPartyMessage = (partyId, content) =>
  api.post(`/api/parties/${partyId}/messages`, { content });
