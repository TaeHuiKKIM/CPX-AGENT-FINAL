import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/PhysicalExamModal.css';

/* ============================ DATA ============================ */
const POSTURE_CHANGE_SECONDS = 2;

const POSTURES = [
  { id: 'supine', ko: '앙와위', en: 'Supine', btn: '눕히기' },
  { id: 'sitting', ko: '좌위', en: 'Sitting', btn: '앉히기' },
  { id: 'prone', ko: '후면 노출', en: 'Back exposed', btn: '뒤돌리기' },
  { id: 'lateral', ko: '측와위', en: 'Lateral', btn: '옆으로' },
  { id: 'standing', ko: '기립', en: 'Standing', btn: '세우기' },
];

const EQUIP = [
  { id: 'stetho', ic: '🩺', nm: '청진기' },
  { id: 'penlight', ic: '🔦', nm: '펜라이트' },
  { id: 'hammer', ic: '🔨', nm: '반사망치' },
  { id: 'bp', ic: '🩸', nm: '혈압계' },
  { id: 'otoscope', ic: '👂', nm: '이경' },
  { id: 'ophthal', ic: '👁️', nm: '검안경' },
];

const MOD = {
  '시': { c: '#0bbfaf', lab: '시진' },
  '청': { c: '#11B89E', lab: '청진' },
  '타': { c: '#B06A06', lab: '타진' },
  '촉': { c: '#2E6FA8', lab: '촉진' },
  '수기': { c: '#7C5BA6', lab: '수기' },
  '측정': { c: '#2F8F73', lab: '측정' },
  '기타': { c: '#4A5C63', lab: '검사' },
};

const CATS = [
  { id: 'vitals', nm: '기초·활력' },
  { id: 'head', nm: '머리·목' },
  { id: 'chest', nm: '가슴·등' },
  { id: 'abd', nm: '배(복부)' },
  { id: 'limb', nm: '팔·다리' },
  { id: 'neuro', nm: '신경계' },
];

const ITEMS = [
  // 기초·활력
  { id: 'v_vital', cat: 'vitals', nm: '활력징후 측정', mod: '측정', equip: 'bp', posture: null, region: null, coop: false, required: true, find: 'BP 132/84 · HR 96회/분 · RR 18회/분 (체온·SpO₂는 제공값 참조)' },
  { id: 'v_appear', cat: 'vitals', nm: '전반적 외모 시진', mod: '시', equip: null, posture: null, region: null, coop: false, required: false, find: '급성 병색, 우상복부를 감싸며 경한 통증 호소' },
  { id: 'v_pulse', cat: 'vitals', nm: '맥박 측정', mod: '촉', equip: null, posture: null, region: null, coop: false, required: false, find: '요골맥 96회/분, 규칙적' },
  // 머리·목
  { id: 'h_conj', cat: 'head', nm: '결막 시진', mod: '시', equip: null, posture: null, region: null, coop: false, required: false, find: '결막 창백 없음, 공막 황달 없음' },
  { id: 'h_thy', cat: 'head', nm: '갑상선 촉진', mod: '촉', equip: null, posture: null, region: null, coop: true, required: false, find: '갑상선 비대·결절 촉지되지 않음' },
  // 가슴·등
  { id: 'c_lung', cat: 'chest', nm: '폐 청진', mod: '청', equip: 'stetho', posture: null, region: null, coop: false, required: false, find: '양폐 정상 호흡음, 수포음·천명음 없음' },
  { id: 'c_heart', cat: 'chest', nm: '심장 청진', mod: '청', equip: 'stetho', posture: null, region: null, coop: false, required: false, find: '규칙적 S1/S2, 심잡음 없음' },
  { id: 'c_cvat', cat: 'chest', nm: '늑척추각 타진(CVAT)', mod: '타', equip: null, posture: 'prone', region: null, coop: true, required: false, ddx: true, find: '양측 늑척추각 압통 없음 (음성) — 신우신염 가능성 낮음' },
  // 배(복부)
  { id: 'a_insp', cat: 'abd', nm: '복부 시진', mod: '시', equip: null, posture: 'supine', region: 'abd', coop: false, required: true, find: '복부 평탄, 반흔·팽만·박동 없음, 호흡에 따라 부드럽게 움직임' },
  { id: 'a_ausc', cat: 'abd', nm: '복부 청진', mod: '청', equip: 'stetho', posture: 'supine', region: 'abd', coop: false, required: true, anchor: true, find: '정상 빈도의 장음, 혈관 잡음 없음' },
  { id: 'a_perc', cat: 'abd', nm: '복부 타진', mod: '타', equip: null, posture: 'supine', region: 'abd', coop: false, required: true, find: '전반적 고창음 정상, 이동 탁음 없음' },
  { id: 'a_palp', cat: 'abd', nm: '복부 촉진', mod: '촉', equip: null, posture: 'supine', region: 'abd', needsQuad: true, coop: false, required: true, find: null },
  { id: 'a_liver', cat: 'abd', nm: '간 촉진', mod: '촉', equip: null, posture: 'supine', region: 'abd', coop: true, required: true, find: '간연 뚜렷이 촉지되지 않음, 촉진 시 우상복부 불편감 동반' },
  { id: 'a_murphy', cat: 'abd', nm: 'Murphy sign', mod: '수기', equip: null, posture: 'supine', region: 'abd', coop: true, required: true, find: 'Murphy 징후 양성 (+) — 흡기 도중 통증으로 호흡을 멈춤' },
  { id: 'a_spleen', cat: 'abd', nm: '비장 촉진', mod: '촉', equip: null, posture: 'supine', region: 'abd', coop: true, required: false, find: '비장 촉지되지 않음' },
  // 팔·다리
  { id: 'l_pulse', cat: 'limb', nm: '말초 맥박 촉진', mod: '촉', equip: null, posture: null, region: null, coop: false, required: false, find: '사지 말초맥박 양호, 좌우 대칭' },
  { id: 'l_edema', cat: 'limb', nm: '함요부종 검사', mod: '촉', equip: null, posture: null, region: null, coop: false, required: false, find: '양 하지 함요 부종 없음' },
  // 신경계 (과잉)
  { id: 'n_dtr', cat: 'neuro', nm: '심부건 반사 검사', mod: '수기', equip: 'hammer', posture: null, region: null, coop: false, required: false, over: true, find: '심부건 반사 정상 (2+), 좌우 대칭' },
  { id: 'n_cn', cat: 'neuro', nm: '뇌신경 검사', mod: '기타', equip: 'penlight', posture: null, region: null, coop: false, required: false, over: true, find: '뇌신경 검사상 이상 없음' },
];

const QUADS = [['RUQ', 'LUQ'], ['RLQ', 'LLQ']];
const CONTACT = ['청', '타', '촉', '수기'];

function postureKo(id) { return (POSTURES.find(p => p.id === id) || {}).ko || id; }
function equipNm(id) { return (EQUIP.find(e => e.id === id) || {}).nm || id; }

export default function PhysicalExamModal({ isOpen, onClose, scenario, onComplete, remainingTime, onTimeDeduct }) {
  // State
  const [mode] = useState('exam');
  const [posture, setPosture] = useState('supine');
  const [changingPosture, setChangingPosture] = useState(null);
  const [hyg, setHyg] = useState({ entry: false, pre: false, post: false });
  const [hygEvents, setHygEvents] = useState([]);
  const [inHand, setInHand] = useState(null);
  const [activeCat, setActiveCat] = useState('abd');
  const [quad, setQuad] = useState(null);
  const [introDone, setIntroDone] = useState(false);
  const [performed, setPerformed] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [abdAuscDone, setAbdAuscDone] = useState(false);
  
  // Stats
  const [contactCount, setContactCount] = useState(0);
  const [usedTime, setUsedTime] = useState(0);
  const [findings, setFindings] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [timeline]);

  const showToast = (msg, isError = false) => {
    setToastMsg({ msg, isError });
    setTimeout(() => setToastMsg(null), 2500);
  };

  const deductTime = (seconds) => {
    if (seconds <= 0) return;
    setUsedTime(prev => prev + seconds);
    onTimeDeduct?.(seconds);
  };

  const handlePosture = (id) => {
    if (changingPosture || id === posture) return;

    setChangingPosture(id);
    deductTime(POSTURE_CHANGE_SECONDS);
    addTimeline({
      kind: 'posture',
      label: `체위 변경 → ${postureKo(id)}`,
      sub: `POSTURE · -${POSTURE_CHANGE_SECONDS}s`,
      cost: POSTURE_CHANGE_SECONDS
    });

    window.setTimeout(() => {
      setPosture(id);
      setChangingPosture(null);
    }, POSTURE_CHANGE_SECONDS * 1000);
  };

  const handleHyg = (k) => {
    setHyg(prev => ({ ...prev, [k]: !prev[k] }));
    addTimeline({ kind: 'hyg', label: `손소독 ${k === 'entry' ? '①입실' : k === 'pre' ? '②접촉 전' : '③종료 후'}`, sub: 'HAND HYGIENE' });
  };

  const handleHygOne = () => {
    setHygEvents(prev => [...prev, { afterContacts: contactCount }]);
    setHyg(prev => ({ ...prev, pre: true })); // mark as done
    addTimeline({ kind: 'hyg', label: '손소독 수행' });
  };

  const handleEquip = (id) => {
    setInHand(prev => prev === id ? null : id);
  };

  const handleIntro = () => {
    if (introDone) return;
    setIntroDone(true);
    addTimeline({ kind: 'intro', label: '진입 선언 · 개방형 확인', sub: 'COMMUNICATION' });
  };

  const palpFinding = (q) => {
    if (q === 'RUQ') return '우상복부(RUQ) 국소 압통 (+), 반발통 (−), 근육 강직 (−)';
    if (q) return `${q} 압통 없음 — 우상복부(RUQ) 별도 확인 필요`;
    return '분면을 특정하지 않아 국소 소견 확인 어려움';
  };

  const addTimeline = (ev) => {
    setTimeline(prev => [...prev, ev]);
  };

  const performItem = (id) => {
    if (performed[id]) {
      showToast('이미 수행한 진찰입니다.', true);
      return;
    }
    if (changingPosture) {
      showToast('체위 변경 중입니다. 잠시 후 진찰을 진행하세요.', true);
      return;
    }

    const it = ITEMS.find(i => i.id === id);
    const contact = CONTACT.includes(it.mod);

    // Evaluate Gates
    const gates = [];
    if (contact && hygEvents.length === 0 && mode === 'exam' && !hyg.pre) {
      gates.push('손소독 누락!');
    }
    if (it.equip && inHand !== it.equip) {
      showToast(`${equipNm(it.equip)}를 먼저 선택하세요.`, true);
      return;
    }
    if (it.posture && posture !== it.posture) {
      showToast(`환자를 ${postureKo(it.posture)} 자세로 변경하세요.`, true);
      return;
    }
    
    let orderOk = null;
    if (it.region === 'abd' && ['타', '촉', '수기'].includes(it.mod)) {
      if (!abdAuscDone) {
        orderOk = false;
        gates.push('청진 선행 위반!');
      } else {
        orderOk = true;
      }
    }
    
    if (it.needsQuad && !quad) {
      showToast('복부 분면(RUQ/LUQ 등)을 선택한 뒤 촉진하세요.', true);
      return;
    }

    // Perform
    setPerformed(prev => ({ ...prev, [id]: { orderOk, quad } }));
    if (it.anchor) setAbdAuscDone(true);
    if (contact) setContactCount(prev => prev + 1);
    
    const cost = it.coop ? 10 : 5;
    deductTime(cost);
    
    const find = it.id === 'a_palp' ? palpFinding(quad) : it.find;
    if (find) {
      setFindings(prev => {
        // 중복 방지
        if (prev.some(f => f.nm === it.nm)) return prev;
        return [...prev, { nm: it.nm, find }];
      });
      showToast(`소견 발견: ${it.nm}`);
    }

    const sub = [MOD[it.mod].lab, it.equip ? equipNm(it.equip) : null, it.needsQuad ? quad : null].filter(Boolean).join(' · ');
    addTimeline({ kind: 'exam', label: it.nm, mod: it.mod, cost, orderOk, gates, sub, find });
  };

  const handleFinish = () => {
    const log = {
      introDone,
      performed,
      hygEvents,
      contactCount,
      usedTime,
      findings,
      timeline
    };
    onComplete(log, findings);
  };

  if (!isOpen) return null;

  return (
    <div className="pe-modal-overlay">
      <div className="pe-modal-container">
        {/* HEADER */}
        <div className="pe-modal-header">
          <div className="pe-modal-title-group">
            <h2 className="pe-modal-title">신체진찰 모듈</h2>
            <span className="pe-patient-tag">
              {scenario?.patientName} 환자 ({scenario?.tag})
            </span>
          </div>
          <div className="pe-header-actions">
            <span className="pe-progress-text">남은 시간 {remainingTime}</span>
            <span className="pe-progress-text">차감 {usedTime}s</span>
            <span className="pe-progress-text">진행도 {Object.keys(performed).length}건</span>
            <button onClick={onClose} className="pe-close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 3-PANEL LAYOUT */}
        <div className="pe-modal-body">
          
          {/* LEFT: STATUS */}
          <div className="pe-panel-left">
            <div>
              <h3 className="pe-section-title">환자 · 체위</h3>
              <div className="pe-posture-display">
                <div className="pe-posture-label">CURRENT POSTURE</div>
                <div className="pe-posture-value">{postureKo(posture)}</div>
                {changingPosture && (
                  <div className="pe-posture-changing">
                    <span className="pe-posture-spinner" />
                    <span>{postureKo(changingPosture)} 체위로 변경 중입니다</span>
                    <strong>-{POSTURE_CHANGE_SECONDS}s</strong>
                  </div>
                )}
              </div>
              <div className="pe-grid-2">
                {POSTURES.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handlePosture(p.id)}
                    disabled={Boolean(changingPosture)}
                    className={`pe-btn-outline ${posture === p.id ? 'active' : ''}`}
                  >
                    {p.btn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="pe-section-title">손소독</h3>
              <button 
                onClick={handleHygOne}
                className={`pe-btn-hygiene ${hygEvents.length > 0 ? 'done' : ''}`}
              >
                <span className="pe-hyg-indicator">
                  <span className="pe-hyg-dot"></span>
                  손소독
                </span>
                <span className="pe-hyg-meta">{hygEvents.length > 0 ? '수행완료' : '직접 시점 판단'}</span>
              </button>
              <p className="pe-note-text">필요하다고 판단하는 시점에 직접 누르세요.</p>
            </div>

            <div>
              <h3 className="pe-section-title">기물 트레이</h3>
              <div className="pe-grid-2">
                {EQUIP.map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleEquip(e.id)}
                    className={`pe-btn-equip ${inHand === e.id ? 'active' : ''}`}
                  >
                    <span>{e.ic}</span>
                    <span className="pe-btn-equip-nm">{e.nm}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER: EXAM ITEMS */}
          <div className="pe-panel-center">
            <button 
              onClick={handleIntro}
              className={`pe-btn-intro ${introDone ? 'done' : ''}`}
            >
              <div className="pe-intro-icon">A</div>
              <div>
                <div className="pe-intro-title">신체진찰 진입 선언 · 개방형 확인</div>
                <div className="pe-intro-desc">"지금부터 신체 진찰을 하겠습니다" + 이름·나이 확인</div>
              </div>
            </button>

            <div className="pe-cat-tabs">
              {CATS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setQuad(null); }}
                  className={`pe-tab-btn ${activeCat === cat.id ? 'active' : ''}`}
                >
                  {cat.nm}
                </button>
              ))}
            </div>

            {activeCat === 'abd' && (
              <div className="pe-quad-selector">
                <span className="pe-quad-title">복부 4분면 선택 <span className="pe-quad-val">{quad || '미선택'}</span></span>
                <div className="pe-quad-grid">
                  {QUADS.flat().map(q => (
                    <button 
                      key={q} 
                      onClick={() => setQuad(q)}
                      className={`pe-quad-btn ${quad === q ? 'active' : ''}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pe-items-list">
              {ITEMS.filter(i => i.cat === activeCat).map(it => {
                const done = !!performed[it.id];
                const m = MOD[it.mod];
                return (
                  <button 
                    key={it.id}
                    onClick={() => performItem(it.id)}
                    disabled={Boolean(changingPosture)}
                    className={`pe-item-btn ${done ? 'done' : ''}`}
                  >
                    <div className="pe-item-icon" style={{ backgroundColor: m.c }}>
                      {it.mod.substring(0,1)}
                    </div>
                    <div className="pe-item-content">
                      <div className="pe-item-name">
                        {it.nm} {it.over && <span className="pe-over-tag">과잉주의</span>}
                      </div>
                      <div className="pe-item-meta">
                        <span style={{ color: m.c }}>{m.lab}</span>
                        {it.equip && <span>🔧 {equipNm(it.equip)}</span>}
                        {it.posture && <span>🧍 {postureKo(it.posture)}</span>}
                        {it.needsQuad && <span>📍 분면 특정</span>}
                      </div>
                    </div>
                    {done && <CheckCircle className="pe-item-check" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: LOGS */}
          <div className="pe-panel-right">
            <h3 className="pe-section-title">수행 타임라인</h3>
            <div className="pe-timeline-container" ref={timelineRef}>
              {timeline.length === 0 ? (
                <div className="pe-empty-text">진찰 항목을 선택하면 여기에 기록됩니다.</div>
              ) : (
                timeline.map((ev, i) => (
                  <div key={i} className="pe-tl-item">
                    <div className="pe-tl-dot" style={{ backgroundColor: ev.mod ? (MOD[ev.mod]?.c || '#64748b') : '#64748b' }}></div>
                    <div className="pe-tl-line"></div>
                    <div className="pe-tl-content">
                      <div className="pe-tl-label">{ev.label}</div>
                      {ev.sub && <div className="pe-tl-sub">{ev.sub}</div>}
                      {ev.cost && <div className="pe-tl-cost">-{ev.cost}s 즉시 반영</div>}
                      {ev.find && (
                        <div className="pe-tl-find">
                          {ev.find}
                        </div>
                      )}
                      {ev.gates && ev.gates.length > 0 && (
                        <div className="pe-tl-gates">
                          {ev.gates.map((g, j) => <span key={j} className="pe-tl-gate">{g}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={handleFinish}
              className="pe-finish-btn"
            >
              진찰 종료 및 문진 복귀
            </button>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toastMsg && (
        <div className={`pe-toast ${toastMsg.isError ? 'error' : 'success'}`}>
          {toastMsg.isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
