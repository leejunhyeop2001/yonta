import api from './axiosInstance';

export const getTimeSlots = (date) =>
  api.get('/api/time-slots', { params: { date } });
