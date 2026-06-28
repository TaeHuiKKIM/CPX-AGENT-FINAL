import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Dashboard({ scenarios, onOpenScenario }) {
  const trackRef = useRef(null);
  const pending = scenarios.filter((s) => s.attempts === 0).length;
  const ongoing = scenarios.filter((s) => s.attempts > 0 && s.bestScore < 90).length;
  const finished = scenarios.filter((s) => s.bestScore >= 90).length;
  const gradients = ['teal', 'blue', 'navy'];
  const notices = [
    { title: 'Medi-CPX 플랫폼 서버 정기 점검 안내', date: '26.06.26', isNew: true },
    { title: '신규 신경과 편두통 시나리오 탑재 안내', date: '26.06.25', isNew: false },
    { title: '실시간 음성 전사(STT) 인식률 개선 안내', date: '26.06.22', isNew: false }
  ];
  const goals = [
    { time: '10:00', title: '김정수 환자 가슴 통증 대화 분석 복습', done: true },
    { time: '14:30', title: '당뇨병 박창호 환자 비약물 처방 연습', active: true },
    { time: '18:00', title: '[과제] AI 편두통 표준환자 대화형 평가' }
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
          {scenarios.map((scen, idx) => (
            <button
              key={scen.id}
              type="button"
              className={`scenario-card-gradient ${gradients[idx % gradients.length]}`}
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
              <div className="card-bottom-row">
                <span className="card-avatar-graphic">{scen.avatar}</span>
                <span className="btn-more">
                  열기 <ArrowRight size={15} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <section className="card-panel">
          <h3>공지사항</h3>
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

        <section className="card-panel">
          <h3>이번 주 일정</h3>
          <div className="calendar-strip-container" id="calendar-strip-container">
            {calendarDays.map((day, i) => (
              <div className="calendar-day-col" key={day.toISOString()}>
                <span className="cal-label">{weekDays[i]}</span>
                <button
                  type="button"
                  className={`cal-number-btn ${day.getDate() === today.getDate() ? 'active' : ''} ${i === 3 || i === 5 ? 'has-event' : ''}`}
                >
                  {day.getDate()}
                </button>
              </div>
            ))}
          </div>
          <div id="today-goals-container">
            {goals.map((goal) => (
              <div
                className={`schedule-timeline-item ${goal.done ? 'completed' : ''} ${goal.active ? 'active' : ''}`}
                key={goal.title}
              >
                <span className="schedule-time">{goal.time}</span>
                <span className="schedule-title">{goal.title}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
