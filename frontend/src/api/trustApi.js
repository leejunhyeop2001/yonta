import api from './axiosInstance';

export const getTrustDashboard = () => api.get('/api/users/me/dashboard');

export const submitMemberReview = (partyId, payload) =>
  api.post(`/api/parties/${partyId}/member-reviews`, payload);

export const submitNoShowReport = (partyId, payload) =>
  api.post(`/api/parties/${partyId}/no-show-reports`, payload);
