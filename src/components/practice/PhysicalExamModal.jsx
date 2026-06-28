import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

/* ============================ DATA ============================ */
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
  '시': { c: 'var(--primary)', lab: '시진' },
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

export default function PhysicalExamModal({ isOpen, onClose, scenario, onComplete }) {
  // State
  const [mode] = useState('exam');
  const [posture, setPosture] = useState('supine');
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

  const handlePosture = (id) => {
    setPosture(id);
    addTimeline({ kind: 'posture', label: `체위 변경 → ${postureKo(id)}`, sub: 'POSTURE' });
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
    setUsedTime(prev => prev + cost);
    
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
    // Generate scoring log to pass to parent
    const log = {
      introDone,
      performed, // 전체 객체 (orderOk, quad 포함)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">신체진찰 모듈</h2>
            <span className="px-3 py-1 bg-[#0bbfaf]/10 text-[#0bbfaf] text-sm font-semibold rounded-full">
              {scenario?.patientName} 환자 ({scenario?.tag})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-slate-500">진행도: {Object.keys(performed).length}건</span>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* 3-PANEL LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: STATUS */}
          <div className="w-64 border-r bg-slate-50 p-5 overflow-y-auto flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">환자 · 체위</h3>
              <div className="bg-[#0bbfaf] text-white p-3 rounded-xl mb-3 shadow-sm">
                <div className="text-[10px] font-mono opacity-80 mb-1">CURRENT POSTURE</div>
                <div className="font-bold text-lg">{postureKo(posture)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {POSTURES.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handlePosture(p.id)}
                    className={`p-2 text-sm font-semibold rounded-lg border transition-colors ${posture === p.id ? 'bg-[#0bbfaf]/10 border-[#0bbfaf] text-[#0bbfaf]' : 'bg-white border-slate-200 text-slate-600 hover:border-[#0bbfaf]/50'}`}
                  >
                    {p.btn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">손소독</h3>
              <button 
                onClick={handleHygOne}
                className={`w-full p-3 text-left flex items-center justify-between rounded-xl border transition-colors ${hygEvents.length > 0 ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-700 hover:border-[#0bbfaf]/50'}`}
              >
                <span className="font-semibold text-sm flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${hygEvents.length > 0 ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
                  손소독
                </span>
                <span className="text-xs text-slate-400 font-mono">{hygEvents.length > 0 ? '수행완료' : '직접 시점 판단'}</span>
              </button>
              <p className="text-xs text-slate-400 mt-2">필요하다고 판단하는 시점에 직접 누르세요.</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-3">기물 트레이</h3>
              <div className="grid grid-cols-2 gap-2">
                {EQUIP.map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleEquip(e.id)}
                    className={`p-2 flex items-center justify-center gap-2 rounded-lg border transition-all ${inHand === e.id ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                  >
                    <span>{e.ic}</span>
                    <span className="text-xs font-semibold">{e.nm}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER: EXAM ITEMS */}
          <div className="flex-1 bg-white p-5 overflow-y-auto">
            <button 
              onClick={handleIntro}
              className={`w-full p-4 flex items-center gap-4 rounded-xl border-2 border-dashed text-left mb-6 transition-colors ${introDone ? 'border-[#0bbfaf] bg-[#0bbfaf]/5' : 'border-slate-300 hover:border-[#0bbfaf]/50 bg-slate-50'}`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${introDone ? 'bg-[#0bbfaf] text-white' : 'bg-slate-200 text-slate-500'}`}>A</div>
              <div>
                <div className="font-bold text-slate-800">신체진찰 진입 선언 · 개방형 확인</div>
                <div className="text-xs text-slate-500 mt-1">"지금부터 신체 진찰을 하겠습니다" + 이름·나이 확인</div>
              </div>
            </button>

            <div className="flex flex-wrap gap-2 mb-4">
              {CATS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setQuad(null); }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${activeCat === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                >
                  {cat.nm}
                </button>
              ))}
            </div>

            {activeCat === 'abd' && (
              <div className="bg-slate-50 border rounded-xl p-4 mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">복부 4분면 선택 <span className="font-mono text-[#0bbfaf] text-xs ml-2">{quad || '미선택'}</span></span>
                <div className="grid grid-cols-2 gap-2 w-48">
                  {QUADS.flat().map(q => (
                    <button 
                      key={q} 
                      onClick={() => setQuad(q)}
                      className={`py-2 text-xs font-mono font-bold rounded-md border transition-colors ${quad === q ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {ITEMS.filter(i => i.cat === activeCat).map(it => {
                const done = !!performed[it.id];
                const m = MOD[it.mod];
                return (
                  <button 
                    key={it.id}
                    onClick={() => performItem(it.id)}
                    className={`w-full flex items-center p-3 rounded-xl border text-left transition-all ${done ? 'bg-[#0bbfaf]/5 border-[#0bbfaf]/40' : 'bg-white border-slate-200 hover:border-[#0bbfaf]/60 shadow-sm'}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg text-white font-bold text-sm mr-4" style={{ backgroundColor: m.c }}>
                      {it.mod.substring(0,1)}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold ${done ? 'text-[#0bbfaf]' : 'text-slate-800'}`}>
                        {it.nm} {it.over && <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded ml-2">과잉주의</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex gap-3">
                        <span style={{ color: m.c }}>{m.lab}</span>
                        {it.equip && <span>🔧 {equipNm(it.equip)}</span>}
                        {it.posture && <span>🧍 {postureKo(it.posture)}</span>}
                        {it.needsQuad && <span>📍 분면 특정</span>}
                      </div>
                    </div>
                    {done && <CheckCircle className="text-[#0bbfaf]" size={20} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: LOGS */}
          <div className="w-80 bg-slate-900 border-l p-5 flex flex-col text-slate-200 overflow-hidden">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4">수행 타임라인</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4" ref={timelineRef}>
              {timeline.length === 0 ? (
                <div className="text-sm text-slate-500">진찰 항목을 선택하면 여기에 기록됩니다.</div>
              ) : (
                timeline.map((ev, i) => (
                  <div key={i} className="flex gap-3 relative">
                    <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10" style={{ backgroundColor: ev.mod ? (MOD[ev.mod]?.c || '#64748b') : '#64748b' }}></div>
                    <div className="absolute left-[5px] top-4 bottom-[-16px] w-[2px] bg-slate-700"></div>
                    <div className="flex-1 pb-4">
                      <div className="font-semibold text-sm text-slate-100">{ev.label}</div>
                      {ev.sub && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{ev.sub}</div>}
                      {ev.find && (
                        <div className="mt-2 text-xs bg-[#0bbfaf]/10 border-l-2 border-[#0bbfaf] p-2 rounded-r-md text-[#0bbfaf] font-medium">
                          {ev.find}
                        </div>
                      )}
                      {ev.gates && ev.gates.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {ev.gates.map((g, j) => <span key={j} className="text-[9px] bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded">{g}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={handleFinish}
              className="mt-4 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg"
            >
              진찰 종료 및 문진 복귀
            </button>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toastMsg && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce-short text-sm font-bold z-[60] ${toastMsg.isError ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
          {toastMsg.isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
