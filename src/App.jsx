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

  const finishPractice = (record, score) => {
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
    alert(`연습 세션이 종료되었습니다! 총점: ${score}점. 성과 분석 리포트로 이동합니다.`);
  };

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onNavigate={navigateTo} />

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
