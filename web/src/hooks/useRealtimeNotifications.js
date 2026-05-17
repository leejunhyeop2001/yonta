import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi';
import { createPartySocket } from '../lib/socket';

const NOTIFICATION_LABELS = {
  MEMBER_JOINED: '👋 참여',
  MEMBER_LEFT: '🚪 탈퇴',
  DEPARTURE_SOON: '⏰ 출발 임박',
  PARTY_DEPARTED: '🚕 출발',
  PARTY_SETTLED: '✅ 종료',
};

export function useRealtimeNotifications(enabled = true) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      const [listRes, countRes] = await Promise.all([getNotifications(), getUnreadCount()]);
      setNotifications(listRes.data.data || []);
      const count = countRes.data.data;
      setUnreadCount(typeof count === 'number' ? count : count?.count ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  const handleIncoming = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
    setUnreadCount((c) => c + 1);
    const prefix = NOTIFICATION_LABELS[notification.type] || '🔔';
    toast(`${prefix} ${notification.title}`, { duration: 5000 });
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, { body: notification.body });
    }
  }, []);

  useEffect(() => {
    if (!enabled || !localStorage.getItem('accessToken')) return undefined;
    refresh();

    const socket = createPartySocket();
    if (socket) {
      socket.on('notification', handleIncoming);
    }

    const pollId = setInterval(refresh, 15000);

    return () => {
      clearInterval(pollId);
      socket?.off('notification', handleIncoming);
      socket?.disconnect();
    };
  }, [enabled, refresh, handleIncoming]);

  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    open,
    setOpen,
    refresh,
    requestPushPermission,
    handleMarkRead,
    handleMarkAllRead,
  };
}
