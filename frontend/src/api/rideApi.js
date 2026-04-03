import api from './axiosInstance';

export const getAvailableParties = (params) => api.get('/api/parties', { params });

export const getPartyDetail = (id) => api.get(`/api/parties/${id}`);

export const createParty = (data) => api.post('/api/parties', data);

export const joinParty = (id) => api.post(`/api/parties/${id}/join`);

export const leaveParty = (id) => api.delete(`/api/parties/${id}/leave`);

export const getMyParties = () => api.get('/api/parties/me');

export const getMyPartyHistory = () => api.get('/api/parties/me/history');

export const submitPartyReview = (id, payload) =>
  api.post(`/api/parties/${id}/reviews`, payload);
