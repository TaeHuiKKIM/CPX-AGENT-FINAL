import { NAV_ITEMS } from '../../constants/navigation';

export default function Sidebar({ activeTab, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <strong>Medi-CPX</strong>
        <span>AI 표준환자 연습</span>
      </div>
      <nav>
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
      </nav>
    </aside>
  );
}
