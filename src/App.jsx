import { useCallback, useEffect, useState } from 'react';
import { initialExpertTimelineLogs, initialNotifications, initialRubricHistoryLogs } from './data/initialData';
import { TABS } from './constants/navigation';
import { cloneData } from './utils/cloneData';
import { api } from './api/client';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import ScenarioDetailModal from './components/scenario/ScenarioDetailModal';
import Dashboard from './pages/Dashboard';
import ScenarioLibrary from './pages/ScenarioLibrary';
import PracticeRoom from './pages/PracticeRoom';
import HistoryPage from './pages/HistoryPage';
import RubricAdmin from './pages/RubricAdmin';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return TABS.includes(hash) ? hash : 'dashboard';
  });
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [notifications, setNotifications] = useState(() => cloneData(initialNotifications));
  const [history, setHistory] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState('scen-angina');
  const [selectedModalScenarioId, setSelectedModalScenarioId] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [rubricLogs, setRubricLogs] = useState(() => cloneData(initialRubricHistoryLogs));
  const [expertLogs, setExpertLogs] = useState(() => cloneData(initialExpertTimelineLogs));

  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  const modalScenario = scenarios.find((scenario) => scenario.id === selectedModalScenarioId);

  const navigateTo = useCallback((tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  }, []);

  const loadWorkspace = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const [scenarioRes, historyRes] = await Promise.all([api.getScenarios(), api.getHistory()]);
      setScenarios(scenarioRes.scenarios || []);
      setHistory(historyRes.history || []);
      if (scenarioRes.scenarios?.[0]) {
        setActiveScenarioId((prev) => scenarioRes.scenarios.some((item) => item.id === prev) ? prev : scenarioRes.scenarios[0].id);
      }
    } catch (err) {
      setDataError(err.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      const token = api.getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const me = await api.me();
        setUser(me.user);
        await loadWorkspace();
      } catch {
        api.clearToken();
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    boot();
  }, [loadWorkspace]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (TABS.includes(hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const login = async (email, password) => {
    setActionLoading(true);
    try {
      const res = await api.login(email, password);
      api.setToken(res.token);
      setUser(res.user);
      await loadWorkspace();
    } finally {
      setActionLoading(false);
    }
  };

  const register = async (payload) => {
    setActionLoading(true);
    try {
      const res = await api.register(payload);
      api.setToken(res.token);
      setUser(res.user);
      await loadWorkspace();
    } finally {
      setActionLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setScenarios([]);
    setHistory([]);
    setSelectedHistoryId(null);
    window.location.hash = '';
  };

  const startScenario = (scenarioId) => {
    setSelectedModalScenarioId(null);
    setActiveScenarioId(scenarioId);
    navigateTo('practice');
  };

  const finishPractice = async (record, score) => {
    let savedRecord = record;

    try {
      const saved = await api.createHistory(record);
      savedRecord = saved.history;
      const updated = await api.updateScenarioStats(record.scenarioId, score);
      setScenarios((prev) => prev.map((scenario) => (scenario.id === updated.scenario.id ? updated.scenario : scenario)));
    } catch (err) {
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
      alert(`서버 저장에는 실패했지만 화면에는 반영했습니다.\n사유: ${err.message}`);
    }

    setHistory((prev) => [savedRecord, ...prev]);
    setSelectedHistoryId(savedRecord.id);
    navigateTo('history');
    alert(`연습 세션이 종료되었습니다! 총점: ${score}점. 성과 분석 리포트로 이동합니다.`);
  };

  const generatePatientResponse = async (payload) => {
    const res = await api.generatePatientResponse(payload);
    return res.patientText;
  };

  const saveRubricsToServer = async (scenarioId, rubrics) => {
    try {
      const res = await api.updateRubrics(scenarioId, rubrics);
      setScenarios((prev) => prev.map((scenario) => (scenario.id === scenarioId ? res.scenario : scenario)));
      return res.scenario;
    } catch (err) {
      alert(`DB 루브릭 저장 실패: ${err.message}`);
      throw err;
    }
  };

  const deleteAllHistory = async () => {
    await api.deleteHistory();
    setHistory([]);
  };

  if (authLoading) {
    return <div className="loading-screen">로그인 상태를 확인하는 중...</div>;
  }

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} loading={actionLoading} />;
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onNavigate={navigateTo} />

      <main className="main-content">
        <Topbar notifications={notifications} setNotifications={setNotifications} user={user} onLogout={logout} />

        {dataError && <div className="data-error">{dataError}</div>}
        {dataLoading && <div className="data-loading">DB 데이터를 불러오는 중...</div>}

        {!dataLoading && activeScenario && (
          <>
            <section className={`content-view ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <Dashboard scenarios={scenarios} onOpenScenario={setSelectedModalScenarioId} />
            </section>

            <section className={`content-view ${activeTab === 'library' ? 'active' : ''}`}>
              <ScenarioLibrary scenarios={scenarios} onOpenScenario={setSelectedModalScenarioId} />
            </section>

            <section className={`content-view ${activeTab === 'practice' ? 'active' : ''}`}>
              <PracticeRoom scenario={activeScenario} onFinish={finishPractice} onGeneratePatientResponse={generatePatientResponse} />
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
                onSaveRubrics={saveRubricsToServer}
              />
            </section>

            <section className={`content-view ${activeTab === 'settings' ? 'active' : ''}`}>
              <SettingsPage setHistory={setHistory} activeTab={activeTab} onDeleteHistory={deleteAllHistory} user={user} />
            </section>
          </>
        )}
      </main>

      {modalScenario && (
        <ScenarioDetailModal
          scenario={modalScenario}
          onClose={() => setSelectedModalScenarioId(null)}
          onStart={() => startScenario(modalScenario.id)}
        />
      )}
    </div>
  );
}
