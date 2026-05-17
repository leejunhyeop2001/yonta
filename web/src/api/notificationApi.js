import api from './axiosInstance';

function wrap(data) {
  return { data: { data, message: 'ok' } };
}

export const getNotifications = async () => {
  const res = await api.get('/notifications');
  const items = (res.data ?? []).map((n) => ({
    ...n,
    createdAt: typeof n.createdAt === 'string' ? n.createdAt : new Date(n.createdAt).toISOString(),
  }));
  return wrap(items);
};

export const getUnreadCount = async () => {
  const res = await api.get('/notifications/unread-count');
  return wrap(res.data?.count ?? 0);
};

export const markNotificationRead = async (id) => {
  await api.patch(`/notifications/${id}/read`);
  return wrap({ ok: true });
};

export const markAllNotificationsRead = async () => {
  await api.post('/notifications/read-all');
  return wrap({ ok: true });
};
