import api from './axiosInstance';

function wrap(data) {
  return { data: { data, message: 'ok' } };
}

export const getProfile = async () => {
  const res = await api.get('/users/me');
  return wrap(res.data);
};

export const updateProfile = async (body) => {
  const res = await api.patch('/users/me', body);
  return wrap(res.data);
};
