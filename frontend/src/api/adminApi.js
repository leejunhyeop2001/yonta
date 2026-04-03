import api from './axiosInstance';

const ADMIN_KEY = 'yonta-admin-2026';

const adminHeaders = { 'X-Admin-Key': ADMIN_KEY };

export const getAllUsers = () =>
  api.get('/api/admin/users', { headers: adminHeaders });

export const searchUsers = (keyword) =>
  api.get('/api/admin/users/search', {
    params: { keyword },
    headers: adminHeaders,
  });

export const getAdminStats = () =>
  api.get('/api/admin/stats', { headers: adminHeaders });
