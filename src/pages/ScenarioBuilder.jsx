import { useState } from 'react';
import { Loader2, Plus, Save } from 'lucide-react';

export default function ScenarioBuilder({ scenarios, setScenarios }) {
  const [disease, setDisease] = useState('');
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState(null);

  const handleGenerate = async () => {
    if (!disease || !symptom) {
      alert('질환명과 주증상을 입력해주세요.');
      return;
    }

    setLoading(true);
    setGeneratedScenario(null);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/v1/scenario/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease, symptom })
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      
      if (data.status === 'success') {
        setGeneratedScenario(data.data);
      }
    } catch (err) {
      console.error(err);
      alert('시나리오 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!generatedScenario) return;
    
    // Check if ID already exists
    const exists = scenarios.find(s => s.id === generatedScenario.id);
    if (exists) {
      generatedScenario.id = `${generatedScenario.id}-${Date.now()}`;
    }

    setScenarios(prev => [generatedScenario, ...prev]);
    alert('새로운 시나리오가 성공적으로 저장되었습니다!');
    setGeneratedScenario(null);
    setDisease('');
    setSymptom('');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>AI 주도 시나리오 생성 (Scale-up)</h2>
        <p>새로운 CPX 질환 케이스를 AI를 통해 자동으로 생성하고 시스템에 등록합니다.</p>
      </header>

      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        <div className="settings-card" style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>1. 질환 정보 입력</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>질환명</label>
              <input 
                type="text" 
                value={disease} 
                onChange={(e) => setDisease(e.target.value)} 
                placeholder="예: 급성 맹장염" 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>주증상</label>
              <input 
                type="text" 
                value={symptom} 
                onChange={(e) => setSymptom(e.target.value)} 
                placeholder="예: 오른쪽 아랫배 통증" 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleGenerate} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            {loading ? 'AI가 시나리오를 구성하는 중... (약 15초 소요)' : '시나리오 자동 생성'}
          </button>
        </div>

        {generatedScenario && (
          <div className="settings-card" style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>2. 생성 결과 미리보기</h3>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={16} /> 저장 및 등록
              </button>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <pre style={{ fontSize: '13px', margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(generatedScenario, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
