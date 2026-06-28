import { X } from 'lucide-react';
import { useState } from 'react';
import { feverChecklistItems } from '../../data/feverChecklist';

export default function ScenarioDetailModal({ scenario, onClose, onStart }) {
  const [mode, setMode] = useState('LEARNING');
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
          {scenario.goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
        <div className="checklist-summary-box">
          <strong>공통 채점 기준</strong>
          <span>발열 CPX 40개 항목 Yes/No · 항목당 2.5점 · 부분점수 없음</span>
          <small>{feverChecklistItems.slice(0, 3).map((item) => item.criterion).join(' / ')} ...</small>
        </div>

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

        <div className="modal-action-row" style={{ flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <label htmlFor="practice-mode-select" style={{ fontSize: '14px', fontWeight: 'bold' }}>진행 모드 선택</label>
            <select 
              id="practice-mode-select" 
              value={mode} 
              onChange={(e) => setMode(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value="LEARNING">학습 모드 (AI 튜터 피드백)</option>
              <option value="EXAM">시험 모드 (힌트 없이 진행)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button type="button" id="btn-modal-cancel" onClick={onClose} style={{ flex: 1 }}>
              취소
            </button>
            <button type="button" className="btn-primary" id="btn-modal-start-practice" onClick={() => onStart(mode)} style={{ flex: 1 }}>
              연습 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
