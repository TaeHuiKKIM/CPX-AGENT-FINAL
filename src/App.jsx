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
import { CheckCircle2 } from 'lucide-react';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createInitialSchedules = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return [
    {
      id: 'sched-review-1',
      type: 'general',
      title: '김정수 환자 가슴 통증 대화 분석 복습',
      date: formatDateKey(today),
      time: '10:00',
      completed: true
    },
    {
      id: 'sched-scenario-1',
      type: 'scenario',
      scenarioId: 'scen-fever-5',
      title: '정수아 환자 급성 신우신염 연습',
      date: formatDateKey(today),
      time: '14:30',
      completed: false
    },
    {
      id: 'sched-general-2',
      type: 'general',
      title: '[과제] AI 표준환자 대화형 평가 준비',
      date: formatDateKey(tomorrow),
      time: '18:00',
      completed: false
    }
  ];
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return TABS.includes(hash) ? hash : 'dashboard';
  });
  const [scenarios, setScenarios] = useState(() => cloneData(initialScenarios));
  const [notifications, setNotifications] = useState(() => cloneData(initialNotifications));
  const [history, setHistory] = useState(() => cloneData(initialHistory));
  const [scheduleItems, setScheduleItems] = useState(() => {
    try {
      const saved = window.localStorage.getItem('medi-cpx-schedule-items');
      return saved ? JSON.parse(saved) : createInitialSchedules();
    } catch {
      return createInitialSchedules();
    }
  });
  const [activeScenarioId, setActiveScenarioId] = useState('scen-fever-1');
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

  useEffect(() => {
    window.localStorage.setItem('medi-cpx-schedule-items', JSON.stringify(scheduleItems));
  }, [scheduleItems]);

  const startScenario = (scenarioId, mode = 'EXAM') => {
    setSelectedModalScenarioId(null);
    setActiveScenarioId(scenarioId);
    setPracticeMode(mode);
    navigateTo('practice');
  };

  const addScheduleItem = (item) => {
    setScheduleItems((prev) => [
      ...prev,
      {
        ...item,
        id: `sched-${Date.now()}`,
        completed: false
      }
    ]);
  };

  const toggleScheduleItem = (scheduleId) => {
    setScheduleItems((prev) =>
      prev.map((item) =>
        item.id === scheduleId
          ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : null }
          : item
      )
    );
  };

  const completeScenarioSchedule = (scenarioId) => {
    const todayKey = formatDateKey(new Date());
    setScheduleItems((prev) => {
      const candidates = prev
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.type === 'scenario' && item.scenarioId === scenarioId && !item.completed);

      if (candidates.length === 0) return prev;

      const sameDay = candidates.find(({ item }) => item.date === todayKey);
      const past = candidates
        .filter(({ item }) => item.date < todayKey)
        .sort((a, b) => `${b.item.date} ${b.item.time}`.localeCompare(`${a.item.date} ${a.item.time}`))[0];
      const future = candidates.sort((a, b) => `${a.item.date} ${a.item.time}`.localeCompare(`${b.item.date} ${b.item.time}`))[0];
      const target = sameDay ?? past ?? future;

      return prev.map((item, index) =>
        index === target.index
          ? { ...item, completed: true, completedAt: new Date().toISOString(), completedByPractice: true }
          : item
      );
    });
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
    completeScenarioSchedule(record.scenarioId);
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
          <Dashboard
            scenarios={scenarios}
            scheduleItems={scheduleItems}
            onAddSchedule={addScheduleItem}
            onToggleSchedule={toggleScheduleItem}
            onOpenScenario={setSelectedModalScenarioId}
            onStartScenario={(scenarioId) => startScenario(scenarioId, 'PRACTICE')}
          />
        </section>

        <section className={`content-view ${activeTab === 'library' ? 'active' : ''}`}>
          <ScenarioLibrary scenarios={scenarios} onOpenScenario={setSelectedModalScenarioId} />
        </section>

        <section className={`content-view ${activeTab === 'practice' ? 'active' : ''}`}>
          <PracticeRoom
            scenario={activeScenario}
            practiceMode={practiceMode}
            onFinish={finishPractice}
            onScenarioCompleted={completeScenarioSchedule}
          />
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
            backgroundColor: '#fff', padding: '48px 40px', borderRadius: '8px',
            textAlign: 'center', maxWidth: '420px', width: '90%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            animation: 'resultPopIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'
          }}>
            <div style={{
              width: '80px', height: '80px', background: 'linear-gradient(135deg, #1266ff, #5b72ff)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#fff'
            }}><CheckCircle2 size={40} /></div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>채점 완료!</h2>
            <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '15px' }}>AI 교수님의 종합 평가가 완료되었습니다</p>
            <div style={{
              background: 'linear-gradient(135deg, #f4f7ff, #e8f0ff)',
              border: '2px solid #1266ff', borderRadius: '8px',
              padding: '24px', marginBottom: '28px'
            }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>총 점수</div>
              <div style={{ fontSize: '56px', fontWeight: 900, color: '#1266ff', lineHeight: 1 }}>
                {resultPopup.score}
                <span style={{ fontSize: '20px', color: '#94a3b8', fontWeight: 500 }}>점</span>
              </div>
            </div>
            <button
              onClick={() => setResultPopup(null)}
              style={{
                width: '100%', padding: '16px', background: 'linear-gradient(135deg, #1266ff, #5b72ff)',
                color: '#fff', border: 'none', borderRadius: '8px',
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
