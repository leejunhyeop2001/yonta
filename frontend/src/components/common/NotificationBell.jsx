import { useEffect } from 'react';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

export default function NotificationBell({ enabled = true }) {
  const {
    notifications,
    unreadCount,
    open,
    setOpen,
    requestPushPermission,
    handleMarkRead,
    handleMarkAllRead,
  } = useRealtimeNotifications(enabled);

  useEffect(() => {
    if (enabled && localStorage.getItem('accessToken')) {
      requestPushPermission();
    }
  }, [enabled, requestPushPermission]);

  if (!enabled || !localStorage.getItem('accessToken')) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        aria-label="알림"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">알림</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  모두 읽음
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">알림이 없습니다</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                      !n.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {n.createdAt?.slice(0, 16).replace('T', ' ')}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
