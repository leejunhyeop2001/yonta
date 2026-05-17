import api from './axiosInstance';
import { mannerTempFromScore } from '../lib/partyAdapter';

function wrap(data, message) {
  return { data: { data, message: message ?? 'ok' } };
}

export const getTrustDashboard = async () => {
  const res = await api.get('/users/me/dashboard');
  return wrap(res.data);
};

export const submitMemberReview = async (partyId, payload) => {
  const res = await api.post(`/parties/${partyId}/member-reviews`, payload);
  return wrap(res.data, '멤버 평가가 저장되었습니다.');
};

export const submitNoShowReport = async (partyId, payload) => {
  const res = await api.post(`/parties/${partyId}/no-show-reports`, payload);
  return wrap(res.data, res.data?.message ?? '노쇼 신고가 접수되었습니다.');
};
