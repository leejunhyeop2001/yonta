import api from './axiosInstance';

const ADMIN_KEY = 'yonta-admin-2026';

const adminHeaders = { 'X-Admin-Key': ADMIN_KEY };

function wrap(data) {
  return { data: { data, message: 'ok' } };
}

export const getAllUsers = () =>
  api.get('/admin/users', { headers: adminHeaders }).then((res) => wrap(res.data));

export const searchUsers = (keyword) =>
  api
    .get('/admin/users/search', { params: { keyword }, headers: adminHeaders })
    .then((res) => wrap(res.data));

export const getAdminStats = () =>
  api.get('/admin/stats', { headers: adminHeaders }).then((res) => wrap(res.data));
