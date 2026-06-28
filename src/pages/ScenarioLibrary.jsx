import { useMemo, useState } from 'react';

export default function ScenarioLibrary({ scenarios, onOpenScenario }) {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [sort, setSort] = useState('default');

  const filtered = useMemo(() => {
    const order = { 상: 3, 중: 2, 하: 1 };
    const list = scenarios.filter((scen) => {
      const q = search.toLowerCase();
      const matchSearch =
        scen.patientName.toLowerCase().includes(q) || scen.tag.toLowerCase().includes(q) || scen.cc.toLowerCase().includes(q);
      const matchSubject = subject === 'all' || scen.subject === subject;
      const matchDifficulty = difficulty === 'all' || scen.difficulty === difficulty;
      return matchSearch && matchSubject && matchDifficulty;
    });

    if (sort === 'difficulty-desc') return [...list].sort((a, b) => order[b.difficulty] - order[a.difficulty]);
    if (sort === 'difficulty-asc') return [...list].sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    if (sort === 'score-desc') return [...list].sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
    return list;
  }, [difficulty, scenarios, search, sort, subject]);

  return (
    <div className="library-page">
      <div className="library-filter-row">
        <input id="library-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="환자명, 증상, 키워드 검색" />
        <select id="filter-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="all">전체 과목</option>
          <option value="내과">내과</option>
          <option value="신경과">신경과</option>
        </select>
        <select id="filter-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="all">전체 난이도</option>
          <option value="상">상</option>
          <option value="중">중</option>
          <option value="하">하</option>
        </select>
        <select id="sort-library" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">기본순</option>
          <option value="difficulty-desc">난이도 높은순</option>
          <option value="difficulty-asc">난이도 낮은순</option>
          <option value="score-desc">최고점수순</option>
        </select>
      </div>

      <div className="library-scenarios-grid" id="library-scenarios-grid">
        {filtered.map((scen) => {
          const diffClass = scen.difficulty === '상' ? 'hard' : scen.difficulty === '중' ? 'medium' : 'easy';
          return (
            <button key={scen.id} type="button" className="scenario-card-standard" onClick={() => onOpenScenario(scen.id)}>
              <div className="scen-top-meta">
                <span className="scen-subject">{scen.subject}</span>
                <span className={`scen-difficulty ${diffClass}`}>난이도 {scen.difficulty}</span>
              </div>
              <div className="scen-info-block">
                <h3>
                  {scen.patientName} ({scen.age}세/{scen.gender})
                </h3>
                <p className="scen-cc">{scen.cc}</p>
              </div>
              <div className="scen-bottom-metrics">
                <div className="scen-metric-item">
                  <span className="scen-metric-label">연습 시도</span>
                  <span className="scen-metric-value">{scen.attempts}회</span>
                </div>
                <div className="scen-metric-item">
                  <span className="scen-metric-label">최고 점수</span>
                  <span className="scen-metric-value best">{scen.bestScore || '--'}점</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
