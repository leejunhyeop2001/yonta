import api from './axiosInstance';

export const sendVerificationEmail = (email) =>
  api.post('/api/auth/send-email', { email });

export const verifyEmailCode = (email, code) =>
  api.post('/api/auth/verify-email', { email, code });

export const signup = ({ email, password, name, studentId, gender }) =>
  api.post('/api/auth/signup', { email, password, name, studentId, gender });

export const login = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const getMyInfo = () =>
  api.get('/api/auth/me');
