import { X } from 'lucide-react';

export default function ScenarioDetailModal({ scenario, onClose, onStart }) {
  const maxVal = Math.max(...scenario.distribution);

  return (
    <div className="scenario-detail-modal active" id="scenario-detail-modal">
      <div className="scenario-detail-drawer">
        <button type="button" className="modal-close-btn" onClick={onClose} id="btn-close-scenario-modal">
          <X size={18} />
        </button>

        <div id="scen-modal-header" className="scen-modal-header">
          <span className="subject-tag">{scenario.subject}</span>
          <h3>{scenario.patientName} 환자 시나리오 상세</h3>
        </div>

        <div className="modal-info-block">
          <h4>Chief Complaint</h4>
          <p id="scen-modal-cc">{scenario.cc}</p>
        </div>
        <div className="modal-info-block">
          <h4>Vital Sign</h4>
          <p id="scen-modal-vs">{scenario.vs}</p>
        </div>
        <div className="modal-info-block">
          <h4>진료 메모</h4>
          <p id="scen-modal-notes">{scenario.notes}</p>
        </div>

        <ul id="scen-modal-categories" className="scen-modal-categories">
          {scenario.rubrics.map((rub) => (
            <li key={rub.id}>
              <strong>{rub.category}</strong>: {rub.item}
            </li>
          ))}
        </ul>

        <div className="modal-stats-row">
          <div>
            <span>시도 횟수</span>
            <strong id="scen-modal-attempts">{scenario.attempts}회</strong>
          </div>
          <div>
            <span>최고 점수</span>
            <strong id="scen-modal-best-score">{scenario.bestScore || '--'}점</strong>
          </div>
        </div>

        <div className="mini-score-chart" id="scen-modal-score-chart">
          {scenario.distribution.map((value, idx) => (
            <div
              key={`${value}-${idx}`}
              className={`bar-col ${idx === 3 ? 'my-score' : ''}`}
              style={{ height: `${maxVal > 0 ? (value / maxVal) * 100 : 0}%` }}
              title={`${idx * 10 + 50}점대: ${value}명`}
            />
          ))}
        </div>

        <div className="modal-action-row">
          <button type="button" id="btn-modal-cancel" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn-primary" id="btn-modal-start-practice" onClick={onStart}>
            연습 시작
          </button>
        </div>
      </div>
    </div>
  );
}
