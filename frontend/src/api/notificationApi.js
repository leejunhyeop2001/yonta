import api from './axiosInstance';

export const getNotifications = () => api.get('/api/notifications');

export const getUnreadCount = () => api.get('/api/notifications/unread-count');

export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read`);

export const markAllNotificationsRead = () => api.patch('/api/notifications/read-all');
