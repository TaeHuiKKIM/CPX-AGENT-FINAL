import { useCallback, useEffect, useState } from 'react';
import { initialExpertTimelineLogs, initialHistory, initialNotifications, initialRubricHistoryLogs, initialScenarios } from './data/initialData';
import { TABS } from './constants/navigation';
import { cloneData } from './utils/cloneData';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import ScenarioDetailModal from './components/scenario/ScenarioDetailModal';
import Dashboard from './pages/Dashboard';
import ScenarioLibrary from './pages/ScenarioLibrary';
import PracticeRoom from './pages/PracticeRoom';
import HistoryPage from './pages/HistoryPage';
import RubricAdmin from './pages/RubricAdmin';
import ScenarioBuilder from './pages/ScenarioBuilder';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { supabase } from './api/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return TABS.includes(hash) ? hash : 'dashboard';
  });
  const [scenarios, setScenarios] = useState(() => cloneData(initialScenarios));
  const [notifications, setNotifications] = useState(() => cloneData(initialNotifications));
  const [history, setHistory] = useState(() => cloneData(initialHistory));
  const [activeScenarioId, setActiveScenarioId] = useState('scen-angina');
  const [selectedModalScenarioId, setSelectedModalScenarioId] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [rubricLogs, setRubricLogs] = useState(() => cloneData(initialRubricHistoryLogs));
  const [expertLogs, setExpertLogs] = useState(() => cloneData(initialExpertTimelineLogs));
  const [practiceMode, setPracticeMode] = useState('EXAM');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleRegister = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw new Error(error.message || JSON.stringify(error));
    if (data?.user && !data?.session) {
      throw new Error("회원가입 성공! (이메일 인증이 필요할 수 있습니다)");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const modalScenario = scenarios.find((scenario) => scenario.id === selectedModalScenarioId);

  const navigateTo = useCallback((tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (TABS.includes(hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const startScenario = (scenarioId, mode = 'EXAM') => {
    setSelectedModalScenarioId(null);
    setActiveScenarioId(scenarioId);
    setPracticeMode(mode);
    navigateTo('practice');
  };

  const [resultPopup, setResultPopup] = useState(null);

  const finishPractice = (record, score) => {
    if (!record || Object.keys(record).length === 0) {
      navigateTo('dashboard');
      return;
    }
    
    setHistory((prev) => [record, ...prev]);
    setScenarios((prev) =>
      prev.map((scenario) => {
        if (scenario.id !== record.scenarioId) return scenario;
        return {
          ...scenario,
          attempts: scenario.attempts + 1,
          bestScore: Math.max(scenario.bestScore || 0, score)
        };
      })
    );
    setSelectedHistoryId(record.id);
    navigateTo('history');
    setResultPopup({ record, score });
  };

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} loading={authLoading} />;
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onNavigate={navigateTo} onLogout={handleLogout} />

      <main className="main-content">
        <Topbar notifications={notifications} setNotifications={setNotifications} />

        <section className={`content-view ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <Dashboard scenarios={scenarios} onOpenScenario={setSelectedModalScenarioId} />
        </section>

        <section className={`content-view ${activeTab === 'library' ? 'active' : ''}`}>
          <ScenarioLibrary scenarios={scenarios} onOpenScenario={setSelectedModalScenarioId} />
        </section>

        <section className={`content-view ${activeTab === 'practice' ? 'active' : ''}`}>
          <PracticeRoom scenario={activeScenario} practiceMode={practiceMode} onFinish={finishPractice} />
        </section>

        <section className={`content-view ${activeTab === 'history' ? 'active' : ''}`}>
          <HistoryPage
            scenarios={scenarios}
            history={history}
            selectedHistoryId={selectedHistoryId}
            setSelectedHistoryId={(id) => setSelectedHistoryId(id)}
          />
        </section>

        <section className={`content-view ${activeTab === 'rubric' ? 'active' : ''}`}>
          <RubricAdmin
            scenarios={scenarios}
            setScenarios={setScenarios}
            activeScenarioId={activeScenarioId}
            setActiveScenarioId={setActiveScenarioId}
            rubricLogs={rubricLogs}
            setRubricLogs={setRubricLogs}
            expertLogs={expertLogs}
            setExpertLogs={setExpertLogs}
          />
        </section>

        <section className={`content-view ${activeTab === 'builder' ? 'active' : ''}`}>
          <ScenarioBuilder scenarios={scenarios} setScenarios={setScenarios} />
        </section>

        <section className={`content-view ${activeTab === 'settings' ? 'active' : ''}`}>
          <SettingsPage setHistory={setHistory} activeTab={activeTab} />
        </section>
      </main>

      {modalScenario && (
        <ScenarioDetailModal
          scenario={modalScenario}
          onClose={() => setSelectedModalScenarioId(null)}
          onStart={(mode) => startScenario(modalScenario.id, mode)}
        />
      )}

      {/* 채점 결과 팝업 */}
      {resultPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', padding: '48px 40px', borderRadius: '24px',
            textAlign: 'center', maxWidth: '420px', width: '90%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            animation: 'resultPopIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'
          }}>
            <div style={{
              width: '80px', height: '80px', background: 'linear-gradient(135deg, #0bbfaf, #0891b2)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '38px'
            }}>🎉</div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>채점 완료!</h2>
            <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '15px' }}>AI 교수님의 종합 평가가 완료되었습니다</p>
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              border: '2px solid #0bbfaf', borderRadius: '16px',
              padding: '24px', marginBottom: '28px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>총 점수</div>
              <div style={{ fontSize: '56px', fontWeight: 900, color: '#0bbfaf', lineHeight: 1 }}>
                {resultPopup.score}
                <span style={{ fontSize: '20px', color: '#94a3b8', fontWeight: 500 }}>점</span>
              </div>
            </div>
            <button
              onClick={() => setResultPopup(null)}
              style={{
                width: '100%', padding: '16px', background: 'linear-gradient(135deg, #0bbfaf, #0891b2)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => e.target.style.transform='scale(1.02)'}
              onMouseLeave={e => e.target.style.transform='scale(1)'}
            >
              📋 상세 분석 리포트 보기
            </button>
          </div>
          <style>{`@keyframes resultPopIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
