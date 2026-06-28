import { NAV_ITEMS } from '../../constants/navigation';
import { LogOut } from 'lucide-react';

export default function Sidebar({ activeTab, onNavigate, onLogout }) {
  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="brand-block">
        <strong>Medi-CPX</strong>
        <span>AI 표준환자 연습</span>
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {NAV_ITEMS.map(([tabId, label]) => (
          <button
            key={tabId}
            type="button"
            data-tab={tabId}
            className={`sidebar-item nav-item ${activeTab === tabId ? 'active' : ''}`}
            onClick={() => onNavigate(tabId)}
          >
            {label}
          </button>
        ))}
        {onLogout && (
          <button type="button" className="sidebar-item nav-item" style={{ color: 'var(--accent-red)', marginTop: 'auto' }} onClick={onLogout}>
            <LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            로그아웃
          </button>
        )}
      </nav>
    </aside>
  );
}
