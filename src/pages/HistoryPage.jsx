import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { CheckCircle2, Download, Link as LinkIcon, XCircle } from 'lucide-react';

export default function HistoryPage({ scenarios, history, selectedHistoryId, setSelectedHistoryId }) {
  const selected = history.find((h) => h.id === selectedHistoryId) ?? null;

  return (
    <div className="history-page">
      <aside className="history-list-panel">
        <h2>연습 이력</h2>
        <div id="history-items-list">
          {history.map((hist) => {
            const scen = scenarios.find((s) => s.id === hist.scenarioId);
            if (!scen) return null;
            return (
              <button
                key={hist.id}
                type="button"
                data-hist-id={hist.id}
                className={`history-list-item ${selectedHistoryId === hist.id ? 'active' : ''}`}
                onClick={() => setSelectedHistoryId(hist.id)}
              >
                <div className="hist-top">
                  <span>{hist.date}</span>
                  <span>PPI: {hist.ppi}</span>
                </div>
                <h4 className="hist-title">
                  {scen.patientName} ({scen.tag})
                </h4>
                <div className="hist-meta">
                  <span>진행 시간: {hist.duration}</span>
                  <span className="hist-score">{hist.score}점</span>
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

    const scores = { 병력청취: 0, 의사소통: 0, 설명교육: 0 };
    const maxScores = { 병력청취: 0, 의사소통: 0, 설명교육: 0 };

    scen.rubrics.forEach((rub) => {
      if (scores[rub.category] === undefined) return;
      maxScores[rub.category] += rub.weight;
      if (hist.checkedRubrics.includes(rub.id)) scores[rub.category] += rub.weight;
    });

    const categories = Object.keys(scores);
    const userScores = categories.map((cat) => (maxScores[cat] ? Math.round((scores[cat] / maxScores[cat]) * 100) : 0));

    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['병력청취', '의사소통(PPI)', '설명 및 교육', '진단추론', '신체진찰'],
        datasets: [
          {
            label: '영역별 성취 백분율',
            data: [...userScores, 70, 60],
            backgroundColor: 'rgba(11, 191, 169, 0.2)',
            borderColor: 'rgba(11, 191, 169, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(11, 191, 169, 1)'
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

  const strengths = hist.strengths?.length > 0 ? hist.strengths : [];
  if (strengths.length === 0) {
    if (hist.checkedRubrics.includes('r1')) strengths.push('주소증 발현 기간과 지속 시간을 꼼꼼히 여쭈어 감별 진단 단서를 수집했습니다.');
    if (hist.checkedRubrics.includes('r2')) strengths.push('환자가 호소하는 통증의 양상을 자연스럽게 문진했습니다.');
    if (hist.checkedRubrics.includes('r4')) strengths.push('환자의 불안에 대해 공감하며 차분하게 대화를 진행했습니다.');
    if (strengths.length === 0) strengths.push('환자가 문진에 대답하도록 적절한 흐름을 유지하였습니다.');
  }

  const missed = scen.rubrics.filter((r) => !hist.checkedRubrics.includes(r.id));
  const weaknesses = hist.weaknesses?.length > 0 ? hist.weaknesses : missed.map(m => `[${m.category}] ${m.item} 항목 문진을 누락하였습니다.`);

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

      <div className="report-metrics-grid">
        <Metric label="진행 시간" value={hist.duration} id="rep-duration" />
        <Metric label="발화 비율" value={hist.ratio} id="rep-speech-ratio" />
        <Metric label="만족도" value={`${hist.satisfaction}%`} id="rep-satisfaction" />
        <Metric label="PPI 등급" value={hist.ppi} id="rep-ppi-grade" />
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
          <div className="explainable-feedback-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderLeft: '4px solid var(--primary)', borderRadius: '8px' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '10px' }}>AI 상세 피드백 (Explainable Feedback)</h3>
            {hist.explainable_feedback.map((fb, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <strong style={{ color: 'var(--primary-dark)' }}>{fb.topic}</strong>: {fb.reason}
              </div>
            ))}
          </div>
        )}

        {!hist.explainable_feedback && (
          <p id="rep-coaching-tip" className="coaching-tip">
            {missed.length > 0 ? `다음 유도 질문 예시: "${missed[0].keyword[0]}에 대해 알려주시겠습니까?"` : '현재 완벽한 상태입니다. 실전 CPX에서도 동일한 루틴으로 임해주시기 바랍니다.'}
          </p>
        )}
      </div>

      <div className={`report-tab-content ${reportTab === 'scores' ? 'active' : ''}`} id="rep-content-scores">
        <div id="rep-rubric-checklist">
          {scen.rubrics.map((rub) => {
            const checked = hist.checkedRubrics.includes(rub.id);
            return (
              <div key={rub.id} className={`rubric-report-item ${checked ? 'checked' : 'missed'}`}>
                <div className={`rubric-item-status-icon ${checked ? 'checked' : 'missed'}`}>
                  {checked ? <CheckCircle2 /> : <XCircle />}
                </div>
                <div className="rubric-item-text">
                  <span className="rubric-item-title">{rub.item}</span>
                  <span className="rubric-item-desc">
                    가중치 배점: {rub.weight}점 ({rub.category})
                  </span>
                </div>
                <span className="rubric-item-score-tag">
                  {checked ? rub.weight : 0} / {rub.weight}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`report-tab-content ${reportTab === 'transcript' ? 'active' : ''}`} id="rep-content-transcript">
        <div id="rep-transcript-list">
          {hist.transcript.map((tr, index) => {
            const matchedRub =
              tr.speaker === 'doctor' ? scen.rubrics.find((r) => r.keyword.some((kw) => tr.text.includes(kw))) : null;
            return (
              <div key={`${tr.speaker}-${index}`} className={`transcript-line ${tr.speaker}`}>
                <span className="trans-speaker">{tr.speaker === 'doctor' ? '의사(나)' : '환자'}</span>
                <div className="trans-content-block">
                  <span className="trans-speech">{tr.text}</span>
                  <div className="trans-meta-row">
                    <span>발화 #{index + 1}</span>
                    {matchedRub && (
                      <button type="button" className="btn-link-evidence" onClick={showScoresTab}>
                        <LinkIcon size={14} /> 근거 구간 연결 ({matchedRub.category})
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
