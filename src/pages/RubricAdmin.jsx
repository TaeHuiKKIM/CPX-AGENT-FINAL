import { useEffect, useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';

export default function RubricAdmin({
  scenarios,
  setScenarios,
  activeScenarioId,
  setActiveScenarioId,
  rubricLogs,
  setRubricLogs,
  expertLogs,
  setExpertLogs
}) {
  const activeScen = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const [editRows, setEditRows] = useState(activeScen.rubrics);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setEditRows(activeScen.rubrics);
  }, [activeScen.id, activeScen.rubrics]);

  const logs = rubricLogs[activeScen.id] ?? [{ ver: 'v1.0', author: '어드민', date: '', desc: '최초 설정' }];
  const comments = expertLogs[activeScen.id] ?? [];

  const updateRow = (index, field, value) => {
    setEditRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: field === 'weight' ? Number(value) : value } : row)));
  };

  const deleteRow = (id) => {
    setEditRows((prev) => prev.filter((row) => row.id !== id));
  };

  const addRow = () => {
    setEditRows((prev) => [
      ...prev,
      { id: `r_${Date.now()}`, category: '병력청취', item: '신규 평가 항목을 입력하세요', weight: 10, checked: false, keyword: [] }
    ]);
  };

  const saveRubric = () => {
    setScenarios((prev) => prev.map((scen) => (scen.id === activeScen.id ? { ...scen, rubrics: editRows } : scen)));
    const nextVer = `v1.${logs.length + 1}`;
    setRubricLogs((prev) => ({
      ...prev,
      [activeScen.id]: [
        {
          ver: nextVer,
          author: '김어드민 (교수)',
          date: new Date().toLocaleString('ko-KR', { hour12: false }),
          desc: '어드민 콘솔에서 루브릭 항목 일괄 수정 및 저장.'
        },
        ...logs
      ]
    }));
    alert(`루브릭 설정이 저장되었으며 ${nextVer} 버전으로 업데이트되었습니다!`);
  };

  const showHistory = () => {
    const logStr = logs.map((l) => `[${l.ver}] ${l.author} - ${l.date}\n사유: ${l.desc}`).join('\n\n');
    alert(`--- 버전 이력 로그 ---\n\n${logStr}`);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    setExpertLogs((prev) => ({
      ...prev,
      [activeScen.id]: [
        ...(prev[activeScen.id] ?? []),
        { author: '김하나 (검수자)', comment: newComment.trim(), date: new Date().toISOString().substring(0, 10), approved: true }
      ]
    }));
    setNewComment('');
  };

  return (
    <div className="rubric-admin-page">
      <aside className="rubric-selector-panel">
        <h2>시나리오 선택</h2>
        <ul id="rubric-scenarios-selector">
          {scenarios.map((scen) => (
            <li key={scen.id}>
              <button
                type="button"
                className={`rubric-scen-item ${scen.id === activeScen.id ? 'active' : ''}`}
                onClick={() => setActiveScenarioId(scen.id)}
              >
                {scen.patientName} ({scen.tag})
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="rubric-editor-panel">
        <div className="rubric-editor-head">
          <div>
            <h2 id="rubric-editor-title">{activeScen.patientName} 루브릭 설정</h2>
            <span id="rubric-version-text">{logs[0].ver} (활성 상태)</span>
          </div>
          <div className="rubric-actions">
            <button type="button" id="btn-rubric-history" onClick={showHistory}>
              버전 이력
            </button>
            <button type="button" id="btn-save-rubric" className="btn-primary" onClick={saveRubric}>
              저장
            </button>
          </div>
        </div>

        <div id="rubric-items-list-container">
          {editRows.map((rub, index) => (
            <div key={rub.id} className="rubric-edit-item-row">
              <div className="rubric-drag-handle">
                <GripVertical size={18} />
              </div>
              <div className="rubric-inputs-block">
                <input className="input-category" value={rub.category} onChange={(e) => updateRow(index, 'category', e.target.value)} />
                <input className="input-item-text" value={rub.item} onChange={(e) => updateRow(index, 'item', e.target.value)} />
                <input className="input-weight" type="number" value={rub.weight} onChange={(e) => updateRow(index, 'weight', e.target.value)} />
              </div>
              <button type="button" className="btn-delete-item" onClick={() => deleteRow(rub.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" id="btn-add-rubric-item" onClick={addRow}>
          + 평가 항목 추가
        </button>

        <div className="workflow-panel">
          <h3>전문가 검수 워크플로우</h3>
          <div id="rubric-review-timeline">
            {comments.map((comment, index) => (
              <div key={`${comment.author}-${index}`} className={`workflow-node ${comment.approved ? 'approved' : ''}`}>
                <div className="workflow-meta">
                  <strong>{comment.author}</strong> - <span>{comment.date}</span>
                </div>
                <p className="workflow-comment">&quot;{comment.comment}&quot;</p>
              </div>
            ))}
          </div>
          <div className="workflow-comment-row">
            <input
              id="new-workflow-comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="검수 의견을 입력하세요"
            />
            <button type="button" id="btn-add-workflow-comment" onClick={addComment}>
              의견 추가
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
