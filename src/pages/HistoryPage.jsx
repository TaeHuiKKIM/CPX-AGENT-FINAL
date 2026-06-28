import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { CheckCircle2, Download, Link as LinkIcon, XCircle } from 'lucide-react';
import { feverChecklistItems } from '../data/feverChecklist';

export default function HistoryPage({ scenarios, history, selectedHistoryId, setSelectedHistoryId }) {
  const selected = history.find((h) => h.id === selectedHistoryId) ?? null;

  return (
    <div className="history-page">
      <aside className="history-list-panel">
        <h2>연습 이력</h2>
        <div id="history-items-list">
          {history.length === 0 && (
            <p style={{ color: '#94a3b8', padding: '16px', textAlign: 'center' }}>아직 연습 이력이 없습니다.</p>
          )}
          {history.map((hist) => {
            const scen = scenarios.find((s) => s.id === hist.scenarioId);
            return (
              <button
                key={hist.id}
                type="button"
                data-hist-id={hist.id}
                className={`history-list-item ${selectedHistoryId === hist.id ? 'active' : ''} ${hist.evaluationStatus === 'failed' ? 'failed' : ''}`}
                onClick={() => setSelectedHistoryId(hist.id)}
              >
                <div className="hist-top">
                  <span>{hist.date || '날짜 없음'}</span>
                  <span>{hist.evaluationStatus === 'failed' ? '채점 실패' : `PPI: ${hist.ppi || '-'}`}</span>
                </div>
                <h4 className="hist-title">
                  {scen ? `${scen.patientName} (${scen.tag})` : hist.scenarioId}
                </h4>
                <div className="hist-meta">
                  <span>진행 시간: {hist.duration || '-'}</span>
                  <span className="hist-score">{hist.score ?? 0}점</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="history-report-panel">
        {!selected ? (
          <div className="report-placeholder">왼쪽에서 리포트를 선택하면 상세 분석이 표시됩니다.</div>
        ) : (
          <DetailedReport hist={selected} scenarios={scenarios} />
        )}
      </section>
    </div>
  );
}

function DetailedReport({ hist, scenarios }) {
  const [reportTab, setReportTab] = useState('summary');
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const scen = scenarios.find((s) => s.id === hist.scenarioId);

  useEffect(() => {
    if (!chartRef.current || !scen) return undefined;
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const checklist = hist.checklistItems?.length ? hist.checklistItems : feverChecklistItems.map((item) => ({ ...item, result: 'No' }));
    const domainGroups = [
      ['병력청취', checklist.filter((item) => item.domain?.includes('병력'))],
      ['의사소통(PPI)', checklist.filter((item) => item.domain === 'PPI')],
      ['설명 및 교육', checklist.filter((item) => item.domain?.includes('환자 교육'))],
      ['임상 술기', checklist.filter((item) => item.domain?.includes('임상 술기'))],
      ['신체진찰', checklist.filter((item) => item.domain?.includes('신체 진찰'))]
    ];
    const userScores = domainGroups.map(([, items]) => {
      if (!items.length) return 0;
      const yesCount = items.filter((item) => item.result === 'Yes').length;
      return Math.round((yesCount / items.length) * 100);
    });

    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'radar',
      data: {
        labels: domainGroups.map(([label]) => label),
        datasets: [
          {
            label: '영역별 성취 백분율',
            data: userScores,
            backgroundColor: 'rgba(18, 102, 255, 0.2)',
            borderColor: 'rgba(18, 102, 255, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(18, 102, 255, 1)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 100 } }
      }
    });

    return () => chartInstanceRef.current?.destroy();
  }, [hist, scen]);

  if (!scen) return null;

  const checklist = hist.checklistItems?.length ? hist.checklistItems : feverChecklistItems.map((item) => ({ ...item, result: 'No' }));
  const checkedRubrics = checklist.filter((item) => item.result === 'Yes').map((item) => item.id);
  const yesCount = hist.yes_count ?? checkedRubrics.length;
  const totalItems = hist.total_items ?? checklist.length;
  const strengths = hist.strengths?.length > 0 ? hist.strengths : [];
  if (strengths.length === 0) {
    if (checkedRubrics.includes(1)) strengths.push('발열의 시작 시기와 지속 기간을 확인해 감별 진단의 출발점을 잡았습니다.');
    if (checkedRubrics.includes(4)) strengths.push('오한, 체중 변화, 근육통, 식은땀 등 전신 증상을 확인했습니다.');
    if (checkedRubrics.includes(40)) strengths.push('환자의 불안에 대해 공감하며 차분하게 대화를 진행했습니다.');
    if (strengths.length === 0) strengths.push('환자가 문진에 대답하도록 적절한 흐름을 유지하였습니다.');
  }

  const missed = hist.missedItems?.length ? hist.missedItems : checklist.filter((item) => item.result !== 'Yes');
  const weaknesses = hist.weaknesses?.length > 0 ? hist.weaknesses : missed.slice(0, 6).map(m => `[${m.domain ?? '누락'}] ${m.criterion} 항목이 No로 판정되었습니다.`);

  const showScoresTab = () => setReportTab('scores');

  return (
    <div id="report-details-view" className="report-details-view">
      <div className="report-header-block">
        <span id="rep-date">{hist.date} 진행</span>
        <h2 id="rep-scenario-title">
          {scen.patientName} 환자 ({scen.tag})
        </h2>
        <strong id="rep-total-score">{hist.score}점</strong>
      </div>

      {hist.evaluationStatus === 'failed' && (
        <div className="report-alert-box" role="alert">
          <strong>채점 서버 오류로 자동 채점이 완료되지 않았습니다.</strong>
          <span>대화 기록과 신체진찰 기록은 보존되었습니다. 아래 오류를 확인한 뒤 서버 상태 또는 환경변수를 점검하세요.</span>
          {hist.evaluationError && <code>{hist.evaluationError}</code>}
        </div>
      )}

      <div className="report-metrics-grid">
        <Metric label="진행 시간" value={hist.duration} id="rep-duration" />
        <Metric label="발화 비율" value={hist.ratio} id="rep-speech-ratio" />
        <Metric label="Yes 항목" value={`${yesCount}/${totalItems}`} id="rep-satisfaction" />
        <Metric label="판정 방식" value="Yes/No 100점" id="rep-ppi-grade" />
      </div>

      <div className="report-chart-box">
        <canvas id="report-radar-chart" ref={chartRef} />
      </div>

      <div className="report-tab-row">
        {[
          ['summary', '요약'],
          ['scores', '루브릭 채점'],
          ['transcript', '전사 기록']
        ].map(([id, label]) => (
          <button key={id} type="button" data-report-tab={id} className={reportTab === id ? 'active' : ''} onClick={() => setReportTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className={`report-tab-content ${reportTab === 'summary' ? 'active' : ''}`} id="rep-content-summary">
        <div className="coaching-grid">
          <div>
            <h3>잘한 점 (Strengths)</h3>
            <ul id="rep-strengths-list">
              {strengths.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>보완할 점 (Weaknesses)</h3>
            <ul id="rep-improvements-list">
              {weaknesses.length > 0 ? (
                weaknesses.map((w, idx) => <li key={idx}>{w}</li>)
              ) : (
                <li>보완할 점이 없습니다. 환자 치료 및 대화에 모범적인 문진을 진행하셨습니다!</li>
              )}
            </ul>
          </div>
        </div>

        {hist.explainable_feedback && hist.explainable_feedback.length > 0 && (
          <div className="explainable-feedback-section">
            <h3>AI 상세 피드백</h3>
            {hist.explainable_feedback.map((fb, idx) => (
              <div key={idx} className="feedback-note">
                <strong>{fb.topic}</strong>
                <p>{fb.reason}</p>
              </div>
            ))}
          </div>
        )}

        {!hist.explainable_feedback && (
          <p id="rep-coaching-tip" className="coaching-tip">
            {missed.length > 0
              ? `다음 유도 질문 예시: "${missed[0]?.criterion ?? '관련 증상'}에 대해 확인하겠습니다."`
              : '현재 완벽한 상태입니다. 실전 CPX에서도 동일한 루틴으로 임해주시기 바랍니다.'}
          </p>
        )}
      </div>

      <div className={`report-tab-content ${reportTab === 'scores' ? 'active' : ''}`} id="rep-content-scores">
        <div id="rep-rubric-checklist">
          {checklist.map((rub) => {
            const checked = rub.result === 'Yes';
            return (
              <div key={rub.id} className={`rubric-report-item ${checked ? 'checked' : 'missed'}`}>
                <div className={`rubric-item-status-icon ${checked ? 'checked' : 'missed'}`}>
                  {checked ? <CheckCircle2 /> : <XCircle />}
                </div>
                <div className="rubric-item-text">
                  <span className="rubric-item-title">{rub.criterion}</span>
                  <span className="rubric-item-desc">
                    {rub.domain} · 근거: {rub.evidence || (checked ? '수행 근거가 확인되었습니다.' : '명확한 수행 근거가 없습니다.')}
                  </span>
                </div>
                <span className="rubric-item-score-tag">
                  {checked ? 'Yes' : 'No'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`report-tab-content ${reportTab === 'transcript' ? 'active' : ''}`} id="rep-content-transcript">
        <div id="rep-transcript-list">
          {(hist.transcript || []).map((tr, index) => {
            const matchedRub =
              tr.speaker === 'doctor'
                ? checklist.find((r) => r.evidence && tr.text?.includes(r.evidence.replace(/^학생:\s*/, '').slice(0, 12)))
                : null;
            return (
              <div key={`${tr.speaker}-${index}`} className={`transcript-line ${tr.speaker}`}>
                <span className="trans-speaker">{tr.speaker === 'doctor' ? '의사(나)' : '환자'}</span>
                <div className="trans-content-block">
                  <span className="trans-speech">{tr.text}</span>
                  <div className="trans-meta-row">
                    <span>발화 #{index + 1}</span>
                    {matchedRub && (
                      <button type="button" className="btn-link-evidence" onClick={showScoresTab}>
                        <LinkIcon size={14} /> 근거 구간 연결 ({matchedRub.domain})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" id="btn-download-report" onClick={() => alert('성과 진단 리포트를 PDF 문서로 다운로드합니다. (준비 중)')}>
        <Download size={16} /> 리포트 다운로드
      </button>
    </div>
  );
}

function Metric({ label, value, id }) {
  return (
    <div className="report-metric-card">
      <span>{label}</span>
      <strong id={id}>{value}</strong>
    </div>
  );
}
