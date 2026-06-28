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
            setSelectedHistoryId={setSelectedHistoryId}
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
    </div>
  );
}
