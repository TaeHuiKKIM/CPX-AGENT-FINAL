import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

const PAGE_COPY = {
  dashboard: {
    title: (name) => `안녕하세요, 예비의사 ${name} 님`,
    subtitle: '오늘의 CPX 연습 목표를 확인하고 바로 시작하세요.'
  },
  library: {
    title: () => '시나리오 라이브러리',
    subtitle: '발열 CPX 케이스를 비교하고 필요한 시나리오를 선택하세요.'
  },
  practice: {
    title: () => 'CPX 연습실',
    subtitle: '문진, 신체진찰, 설명 교육 흐름을 실제 시험처럼 진행하세요.'
  },
  history: {
    title: () => '성과 리포트',
    subtitle: '채점 결과와 전사 기록을 확인하고 다음 연습 포인트를 정리하세요.'
  },
  rubric: {
    title: () => '루브릭 관리',
    subtitle: '케이스별 평가 기준과 전문가 검수 이력을 관리하세요.'
  },
  builder: {
    title: () => '시나리오 생성기',
    subtitle: 'AI 초안 생성과 검수 흐름으로 신규 CPX 케이스를 확장하세요.'
  },
  settings: {
    title: () => '설정',
    subtitle: '프로필, 장치 테스트, 학습 데이터 설정을 관리하세요.'
  }
};

const getUserName = (user) => {
  const metadata = user?.user_metadata ?? {};
  return metadata.name || metadata.full_name || metadata.display_name || user?.email?.split('@')[0] || '김하나';
};

export default function Topbar({ activeTab = 'dashboard', user, notifications, setNotifications }) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const pageCopy = PAGE_COPY[activeTab] ?? PAGE_COPY.dashboard;
  const userName = getUserName(user);

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
        <h2>{pageCopy.title(userName)}</h2>
        <p>{pageCopy.subtitle}</p>
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
