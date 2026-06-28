import { useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Play, Plus } from 'lucide-react';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard({
  scenarios,
  scheduleItems = [],
  onAddSchedule = () => {},
  onToggleSchedule = () => {},
  onOpenScenario,
  onStartScenario = () => {}
}) {
  const trackRef = useRef(null);
  const todayKey = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [scheduleType, setScheduleType] = useState('scenario');
  const [selectedScenarioId, setSelectedScenarioId] = useState(() => scenarios[0]?.id ?? '');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleTime, setScheduleTime] = useState('14:00');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const pending = scenarios.filter((s) => s.attempts === 0).length;
  const ongoing = scenarios.filter((s) => s.attempts > 0 && s.bestScore < 90).length;
  const finished = scenarios.filter((s) => s.bestScore >= 90).length;
  const notices = [
    { title: 'medirole 플랫폼 서버 정기 점검 안내', date: '26.06.26', isNew: true },
    { title: '신규 신경과 편두통 시나리오 탑재 안내', date: '26.06.25', isNew: false },
    { title: '실시간 음성 전사(STT) 인식률 개선 안내', date: '26.06.22', isNew: false }
  ];
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const schedulesByDate = useMemo(() => {
    return scheduleItems.reduce((acc, item) => {
      acc[item.date] = [...(acc[item.date] ?? []), item];
      return acc;
    }, {});
  }, [scheduleItems]);

  const selectedSchedules = useMemo(() => {
    return [...(schedulesByDate[selectedDate] ?? [])].sort((a, b) => a.time.localeCompare(b.time));
  }, [schedulesByDate, selectedDate]);

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0];

  const handleAddSchedule = (event) => {
    event.preventDefault();
    if (!scheduleTime) return;

    if (scheduleType === 'scenario') {
      if (!selectedScenario) return;
      onAddSchedule({
        type: 'scenario',
        scenarioId: selectedScenario.id,
        title: `${selectedScenario.patientName} 환자 ${selectedScenario.tag} 연습`,
        date: selectedDate,
        time: scheduleTime
      });
    } else if (scheduleTitle.trim()) {
      onAddSchedule({
        type: 'general',
        title: scheduleTitle.trim(),
        date: selectedDate,
        time: scheduleTime
      });
      setScheduleTitle('');
    }
    setIsAddingSchedule(false);
  };

  return (
    <div className="dashboard-page">
      <div className="status-badges-row">
        <span id="count-pending">연습 대기 {pending}</span>
        <span id="count-ongoing">진행 중 {ongoing}</span>
        <span id="count-finished">완료됨 {finished}</span>
      </div>

      <div className="dashboard-scenarios-section">
        <div className="section-head-row">
          <h3>추천 시나리오</h3>
          <button
            type="button"
            id="carousel-next-btn"
            onClick={() => trackRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
          >
            다음
          </button>
        </div>

        <div className="dashboard-scenarios-list" id="dashboard-scenarios-list" ref={trackRef}>
          {scenarios.map((scen) => (
            <button
              key={scen.id}
              type="button"
              className="scenario-card-gradient"
              onClick={() => onOpenScenario(scen.id)}
            >
              <div className="card-top-row">
                <span className="card-type-tag">{scen.subject}</span>
                <span className="card-status-text">{scen.attempts > 0 ? '진행 중' : '대기'}</span>
              </div>
              <div className="card-middle-content">
                <h4 className="card-patient-name">
                  {scen.patientName} ({scen.age}세/{scen.gender})
                </h4>
                <p className="card-patient-desc">{scen.tag}</p>
                <span className="card-meta-text">최고 점수: {scen.bestScore || '--'}점</span>
              </div>
              <div className="scenario-card-tags">
                <span>{scen.subject}</span>
                <span>난이도 {scen.difficulty}</span>
                <span>{scen.tag.replace(/\s*의증$/, '')}</span>
              </div>
              <div className="card-bottom-row">
                <span className="btn-more">
                  학습하기 <ArrowRight size={15} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="card-panel">
          <div className="section-head-row dashboard-panel-head">
            <h3>공지사항</h3>
          </div>
          <ul id="notice-list-container">
            {notices.map((notice) => (
              <li className="announcement-item" key={notice.title}>
                <div className="announce-title-block">
                  {notice.isNew && <span className="badge-new">NEW</span>}
                  <span>{notice.title}</span>
                </div>
                <span className="announce-date">{notice.date}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-panel schedule-panel">
          <div className="section-head-row dashboard-panel-head schedule-head-row">
            <h3>이번 주 일정</h3>
            <div className="schedule-head-actions">
              <span className="schedule-date-label">{selectedDate}</span>
              <button
                type="button"
                className={`schedule-toggle-add ${isAddingSchedule ? 'active' : ''}`}
                onClick={() => setIsAddingSchedule((prev) => !prev)}
                title={isAddingSchedule ? '일정 추가 닫기' : '일정 추가'}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="calendar-strip-container" id="calendar-strip-container">
            {calendarDays.map((day, i) => {
              const dateKey = formatDateKey(day);
              const hasEvent = Boolean(schedulesByDate[dateKey]?.length);
              const allDone = hasEvent && schedulesByDate[dateKey].every((item) => item.completed);
              return (
              <div className="calendar-day-col" key={day.toISOString()}>
                <span className="cal-label">{weekDays[i]}</span>
                <button
                  type="button"
                  className={`cal-number-btn ${dateKey === selectedDate ? 'active' : ''} ${hasEvent ? 'has-event' : ''} ${allDone ? 'all-done' : ''}`}
                  onClick={() => setSelectedDate(dateKey)}
                  title={`${dateKey} 일정 ${schedulesByDate[dateKey]?.length ?? 0}개`}
                >
                  {day.getDate()}
                </button>
              </div>
              );
            })}
          </div>

          {isAddingSchedule && (
            <form className="schedule-add-form" onSubmit={handleAddSchedule}>
              <div className="schedule-form-row">
                <select value={scheduleType} onChange={(event) => setScheduleType(event.target.value)} aria-label="일정 종류">
                  <option value="scenario">시나리오 연습</option>
                  <option value="general">일반 일정</option>
                </select>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                  aria-label="일정 시간"
                />
              </div>

              {scheduleType === 'scenario' ? (
                <select
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value)}
                  aria-label="시나리오 선택"
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.patientName} - {scenario.tag}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={scheduleTitle}
                  onChange={(event) => setScheduleTitle(event.target.value)}
                  placeholder="일반 일정 제목"
                  aria-label="일반 일정 제목"
                />
              )}

              <button type="submit" className="btn-primary schedule-add-btn">
                <Plus size={16} /> 추가
              </button>
            </form>
          )}

          <div id="today-goals-container" className="schedule-list" tabIndex={0}>
            {selectedSchedules.length === 0 ? (
              <div className="schedule-empty">선택한 날짜에 등록된 일정이 없습니다.</div>
            ) : (
              selectedSchedules.map((item) => {
                const scenario = scenarios.find((s) => s.id === item.scenarioId);
                return (
                  <div
                    className={`schedule-timeline-item ${item.completed ? 'completed' : ''} ${item.date === todayKey && !item.completed ? 'active' : ''}`}
                    key={item.id}
                  >
                    <button
                      type="button"
                      className="schedule-complete-btn"
                      onClick={() => onToggleSchedule(item.id)}
                      title={item.completed ? '미완료로 변경' : '완료 처리'}
                    >
                      {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <span className="schedule-time">{item.time}</span>
                    <div className="schedule-title-block">
                      <span className="schedule-title">{item.title}</span>
                      <span className="schedule-kind">
                        {item.type === 'scenario' ? `시나리오${item.completedByPractice ? ' · 연습 완료' : ''}` : '일반'}
                      </span>
                    </div>
                    {item.type === 'scenario' && scenario && !item.completed && (
                      <button
                        type="button"
                        className="schedule-practice-btn"
                        onClick={() => onStartScenario(item.scenarioId)}
                      >
                        <Play size={14} /> 연습
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
