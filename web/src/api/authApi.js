import api from './axiosInstance';

function wrap(data) {
  return { data: { data, message: 'ok' } };
}

function storeSession(token, email) {
  localStorage.setItem('accessToken', token);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('userName', email.split('@')[0]);
}

export const sendVerificationEmail = async (email) => {
  const res = await api.post('/auth/request-otp', { email });
  return wrap(res.data);
};

export const getAccountStatus = async (email) => {
  const res = await api.get('/auth/account-status', { params: { email } });
  return wrap(res.data);
};

export const verifyEmailCode = async (email, code) => {
  const res = await api.post('/auth/verify-otp', { email, otp: code });
  const { accessToken, requiresPasswordSetup } = res.data ?? {};
  if (accessToken) storeSession(accessToken, email);
  return wrap({
    token: accessToken,
    name: email.split('@')[0],
    email,
    requiresPasswordSetup: Boolean(requiresPasswordSetup),
  });
};

export const loginWithPassword = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  const { accessToken, requiresPasswordSetup } = res.data ?? {};
  if (!accessToken) throw new Error('로그인에 실패했습니다.');
  storeSession(accessToken, email);
  return wrap({
    token: accessToken,
    name: email.split('@')[0],
    email,
    requiresPasswordSetup: Boolean(requiresPasswordSetup),
  });
};

export const login = async (email, otp) => verifyEmailCode(email, otp);

export const setPassword = async (password) => {
  const res = await api.post('/auth/set-password', { password });
  return wrap(res.data);
};

export const signup = async () => {
  throw new Error('회원가입은 OTP 로그인으로 대체되었습니다.');
};

export const getMyInfo = async () => {
  const res = await api.get('/users/me');
  const u = res.data;
  return wrap({
    email: u.email,
    name: u.fullName ?? u.email.split('@')[0],
    mannerTemp: 36.5 + ((u.mannerTemperature ?? 100) - 100) * 0.05,
    hasPassword: Boolean(u.hasPassword),
  });
};
