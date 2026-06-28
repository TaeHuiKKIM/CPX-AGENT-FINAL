import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

export default function Topbar({ notifications, setNotifications }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const markRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  return (
    <header className="topbar">
      <div>
        <h2>안녕하세요, 예비 의사님</h2>
        <p>오늘의 CPX 연습 목표를 확인하고 바로 시작하세요.</p>
      </div>

      <div className="notification-wrapper" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="notification-btn" onClick={() => setOpen((v) => !v)}>
          <Bell size={18} />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>

        <div className={`notification-modal ${open ? 'active' : ''}`}>
          <div className="notification-header">
            <strong>알림</strong>
            <button
              type="button"
              id="btn-clear-notifications"
              onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
            >
              모두 읽음
            </button>
          </div>
          <div id="notification-list">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`notification-item ${n.unread ? 'unread' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <span className="notif-text">{n.text}</span>
                <span className="notif-time">{n.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
