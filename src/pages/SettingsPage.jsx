import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

export default function SettingsPage({ setHistory, activeTab }) {
  const [name, setName] = useState('김하나');
  const [school, setSchool] = useState('의과대학 본과 3학년');
  const [micStatus, setMicStatus] = useState('상태: 정지됨');
  const [volume, setVolume] = useState(0);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (activeTab !== 'settings' || !chartRef.current) return undefined;
    chartInstanceRef.current?.destroy();
    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['병력청취', '의사소통(PPI)', '설명 및 교육', '진단추론', '신체진찰'],
        datasets: [
          {
            label: '최근 10회 평균 역량',
            data: [85, 92, 75, 80, 70],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)'
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { display: true }, suggestedMin: 0, suggestedMax: 100 } } }
    });
    return () => chartInstanceRef.current?.destroy();
  }, [activeTab]);

  const stopMicTest = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMicStatus('상태: 정지됨');
    setVolume(0);
  };

  const toggleMicTest = async () => {
    if (intervalRef.current) {
      stopMicTest();
      return;
    }

    try {
      setMicStatus('상태: 마이크 권한 요청 중...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      setMicStatus('상태: 연결 성공 (말해 보세요)');

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, value) => acc + value, 0);
        const average = sum / bufferLength;
        setVolume(Math.min(100, Math.round((average / 128) * 100)));
      }, 100);
    } catch {
      setMicStatus('오류: 마이크 권한을 획득하지 못했습니다.');
      alert('마이크 오디오 디바이스 연결을 확인할 수 없습니다. 브라우저 장치 권한 설정을 체크해 주세요.');
    }
  };

  useEffect(() => stopMicTest, []);

  return (
    <div className="settings-page">
      <section className="settings-card profile-card">
        <h2 style={{ margin: '0 0 12px' }}>프로필 설정</h2>
        <div className="profile-preview" style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px' }}>
          <strong className="profile-name" style={{ fontSize: '1.2rem', color: '#1e293b' }}>{name || '이름 없음'}</strong>
          <span className="profile-role" style={{ color: '#64748b', fontSize: '0.9rem' }}>{school ? school.substring(0, 15) : '소속 없음'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <input id="profile-input-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (예: 홍길동)" />
          <input id="profile-input-school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="소속 (예: 의과대학 본과 3학년)" />
        </div>
        <button type="button" className="btn-primary" id="btn-save-profile" style={{ padding: '12px', borderRadius: '8px' }} onClick={() => alert('회원 정보 및 목표 진료 일정이 저장되었습니다.')}>
          프로필 저장
        </button>
        <div className="profile-chart-box" style={{ marginTop: '24px' }}>
          <canvas id="profile-radar-chart" ref={chartRef} />
        </div>
      </section>

      <section className="settings-card">
        <h2>장치 테스트</h2>
        <button type="button" id="btn-test-mic" onClick={toggleMicTest}>
          {intervalRef.current ? '테스트 중단' : '마이크 테스트 시작'}
        </button>
        <p id="mic-test-status">{micStatus}</p>
        <div className="volume-indicator-track">
          <div id="volume-indicator-bar" style={{ width: `${volume}%` }} />
        </div>
      </section>

      <section className="settings-card danger-zone">
        <h2>데이터 보안</h2>
        <button
          type="button"
          id="btn-request-data-deletion"
          onClick={() => {
            if (window.confirm('서버에 보관 중인 개인 음성 데이터 및 연습 전사 이력을 모두 영구히 삭제하시겠습니까?')) {
              setHistory([]);
              alert('모든 학습 데이터 삭제가 접수되었으며 즉각 파기되었습니다.');
            }
          }}
        >
          학습 데이터 삭제
        </button>
        <button
          type="button"
          id="btn-request-withdrawal"
          onClick={() => {
            if (window.confirm('정말로 회원 탈퇴를 신청하시겠습니까?')) {
              alert('회원 탈퇴 신청이 접수되었습니다. (영업일 기준 3일 이내 보류 처리)');
            }
          }}
        >
          회원 탈퇴 신청
        </button>
      </section>
    </div>
  );
}
