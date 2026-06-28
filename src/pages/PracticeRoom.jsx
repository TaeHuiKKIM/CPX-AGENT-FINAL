import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Send, Square } from 'lucide-react';
import { formatTime } from '../utils/time';
import { speakWithTTS } from '../utils/speech';
import { api } from '../api/client';
import { supabase } from '../api/supabase';

const FASTAPI_WS_URL = import.meta.env.VITE_FASTAPI_WS_URL || 'ws://localhost:8000/api/v1';

export default function PracticeRoom({ scenario, practiceMode = 'EXAM', onFinish }) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [timer, setTimer] = useState(600);
  const [emotion, setEmotion] = useState({ anxiety: 70, cooperation: 40, satisfaction: 50 });
  const [emotionDesc, setEmotionDesc] = useState('연습을 시작하면 환자의 정서 상태가 반영됩니다.');
  const [isListening, setIsListening] = useState(false);
  
  const chatRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const wsRef = useRef(null); // WebSocket reference
  const messagesRef = useRef(messages);
  const timerRef = useRef(timer);

  useEffect(() => {
    messagesRef.current = messages;
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  const resetRoom = useCallback(() => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop?.();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSession(null);
    setMessages([]);
    setInputValue('');
    setTimer(600);
    setEmotion({ anxiety: 70, cooperation: 40, satisfaction: 50 });
    setEmotionDesc('연습을 시작하면 환자의 정서 상태가 반영됩니다.');
    setIsListening(false);
  }, []);

  useEffect(() => {
    resetRoom();
    return () => resetRoom();
  }, [resetRoom, scenario.id]);

  const appendMessage = useCallback((speaker, text) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { speaker, text, time }]);
  }, []);

  const startSession = async () => {
    // 1. Create a DB Session Record in Supabase (or fallback to Local Test Session)
    let newSession = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('sessions').insert({
          user_id: user.id,
          scenario_id: scenario.id,
          mode: practiceMode,
          status: 'INCOMPLETE'
        }).select().single();
        if (!error) newSession = data;
      }
    } catch (err) {
      console.warn("DB Session insert failed, falling back to local session:", err);
    }

    if (!newSession) {
      // 로컬 테스트용 가짜 세션 (DB 저장 안 됨)
      console.log("Using local test session without login.");
      newSession = { session_id: `test-session-${Date.now()}` };
    }

    setSession(newSession);
    setMessages([]);
    setTimer(600);
    setEmotion({ anxiety: 70, cooperation: 40, satisfaction: 50 });
    setEmotionDesc('환자가 질문에 차근차근 대답하고 있습니다.');

    // 2. Connect to FastAPI WebSocket
    const ws = new WebSocket(`${FASTAPI_WS_URL}/sessions/${newSession.session_id}/stream?mode=${practiceMode}`);
    ws.onopen = () => {
      console.log("WebSocket connected with mode:", practiceMode);
      if (practiceMode === 'ACTIVE') {
        const initialMessage = scenario.cc || scenario.patient_info?.initial_complaint || '선생님, 어디가 아파서 왔습니다.';
        appendMessage('patient', initialMessage);
        speakWithTTS(initialMessage);
      } else {
        // PRACTICE 모드에서는 의사가 먼저 질문하기를 기다림
        setEmotionDesc('환자가 의사 선생님의 첫 질문을 기다리고 있습니다.');
      }
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'ai_reply') {
        appendMessage('patient', data.text);
        speakWithTTS(data.text);
        
        if (data.tutor_guide) {
          setEmotionDesc(`[AI Tutor] ${data.tutor_guide}`);
        } else {
          setEmotionDesc('환자가 질문에 대답했습니다.');
        }
      }
    };
    
    ws.onclose = () => console.log("WebSocket disconnected");
    wsRef.current = ws;
  };

  const processDoctorInput = useCallback((text) => {
    if (!session || !text.trim() || !wsRef.current) return;
    
    const doctorText = text.trim();
    appendMessage('doctor', doctorText);
    
    // Send text to FastAPI via WebSocket
    wsRef.current.send(JSON.stringify({ text: doctorText }));
  }, [appendMessage, session]);

  const stopSession = useCallback(async () => {
    if (!session) return;

    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel();
    if (wsRef.current) {
      wsRef.current.close();
    }

    if (session.session_id.startsWith('test-session')) {
      alert("테스트 세션이 종료되었습니다. AI 교수님의 채점을 시작합니다. (약 10~15초 소요)");
      
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const res = await fetch(`${apiUrl}/v1/feedback/evaluate_anonymous`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario_id: scenario.id,
            transcripts: messagesRef.current,
            rubric_data: { rubrics: scenario.rubrics }
          })
        });
        
        if (!res.ok) throw new Error("Evaluation API Error");
        const evalResult = await res.json();
        
        const aiRecord = {
          id: `mock-history-${Date.now()}`,
          scenarioId: scenario.id,
          date: new Date().toLocaleString('ko-KR'),
          duration: formatTime(600 - timer),
          ratio: '50:50',
          satisfaction: evalResult.score_communication || 80,
          ppi: (evalResult.total_score || 0) >= 90 ? '매우 우수(S)' : (evalResult.total_score || 0) >= 80 ? '우수(A)' : '보통(B)',
          score: evalResult.total_score || 85,
          transcript: messagesRef.current.length > 0 ? messagesRef.current : [{ speaker: 'patient', text: '대화 기록이 없습니다.' }],
          // HistoryPage에서 강점, 약점, 피드백을 보여주기 위해 결과 병합
          ...evalResult,
          checkedRubrics: evalResult.checkedRubrics || []
        };
        
        resetRoom();
        onFinish(aiRecord, aiRecord.score);
      } catch (err) {
        console.error("AI Evaluation failed:", err);
        alert("채점 중 오류가 발생했습니다.");
        resetRoom();
        onFinish({ id: 'error-history', scenarioId: scenario.id, score: 0 }, 0);
      }
      return;
    }

    // Update Session status (실제 로그인 유저만)
    await supabase.from('sessions').update({ status: 'COMPLETED', end_time: new Date().toISOString() }).eq('session_id', session.session_id);

    // Trigger Evaluation in FastAPI
    try {
      await api.triggerEvaluation(session.session_id);
      alert("실습이 종료되었습니다. AI 채점이 진행 중입니다. (대시보드에서 결과를 확인하세요)");
    } catch (err) {
      console.error(err);
      alert("평가 요청 중 오류가 발생했습니다.");
    }

    resetRoom();
    onFinish({}, 0); // Temporary return to trigger UI change in App.jsx
  }, [onFinish, resetRoom, session]);

  useEffect(() => {
    if (!session) return undefined;
    const intervalId = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          window.setTimeout(stopSession, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [session, stopSession]);

  useEffect(() => {
    if (!session) return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInputValue('');
      processDoctorInput(speechToText);
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [processDoctorInput, session]);

  useEffect(() => {
    if (!session || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let angle = 0;
    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = 'var(--primary, #0bbfa9)';
      ctx.lineWidth = 2;
      for (let x = 0; x < canvas.width; x += 1) {
        const amplitude = isListening ? Math.sin(x * 0.05 + angle) * 8 + 12 : Math.sin(x * 0.02 + angle) * 2 + 12;
        ctx.lineTo(x, amplitude);
      }
      ctx.stroke();
      angle += 0.15;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isListening, session]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    processDoctorInput(inputValue);
    setInputValue('');
  };

  const handleMic = () => {
    if (!recognitionRef.current) {
      alert('이 브라우저는 웹 음성 인식을 지원하지 않습니다. 키보드로 타이핑하여 연습하세요.');
      return;
    }
    try {
      recognitionRef.current.start();
    } catch {
      // already listening
    }
  };

  return (
    <div className="practice-page">
      <div className="practice-patient-card">
        <h2 id="practice-patient-name">
          {scenario.title} ({scenario.department})
        </h2>
        <div className="patient-info-line">
          <strong>난이도</strong> <span id="practice-patient-cc">{scenario.difficulty}</span>
        </div>
      </div>

      <div className="practice-main-panel">
        <div className="session-toolbar">
          <strong id="session-timer-text" style={{ color: timer < 60 ? 'var(--accent-red)' : '#1e293b' }}>
            {formatTime(timer)}
          </strong>
          <button type="button" id="btn-session-start" disabled={Boolean(session)} onClick={startSession}>
            연습 시작
          </button>
          <button type="button" id="btn-session-stop" disabled={!session} onClick={stopSession}>
            <Square size={14} /> 종료
          </button>
          <button
            type="button"
            id="btn-session-reset"
            onClick={() => {
              if (window.confirm('연습 기록이 저장되지 않고 초기화됩니다. 다시 시작하시겠습니까?')) resetRoom();
            }}
          >
            <RotateCcw size={14} /> 초기화
          </button>
        </div>

        <div id="chat-transcript-container" ref={chatRef} className="chat-transcript-container">
          {!session && messages.length === 0 ? (
            <div className="chat-placeholder">
              <div className="placeholder-icon">
                <Mic />
              </div>
              <h3>AI 표준환자 연습 세션</h3>
              <p>'연습 시작' 버튼을 누르면 환자가 말을 시작합니다.</p>
              <button type="button" className="btn-primary" id="btn-start-placeholder" onClick={startSession}>
                연습 지금 시작하기
              </button>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.speaker}-${index}`} className={`chat-bubble ${message.speaker === 'doctor' ? 'doctor' : 'patient'}`}>
                <span className="bubble-meta">
                  {message.speaker === 'doctor' ? '의사 (나)' : '표준환자'} - {message.time}
                </span>
                <div className="bubble-content">{message.text}</div>
              </div>
            ))
          )}
        </div>

        <div className="voice-row">
          <canvas id="voice-wave-canvas" width="220" height="28" ref={canvasRef} />
          <span id="stt-indicator" style={{ display: isListening ? 'flex' : 'none' }}>
            음성 인식 중...
          </span>
        </div>

        <div className="chat-input-row">
          <button
            type="button"
            id="btn-mic-toggle"
            className={isListening ? 'listening' : ''}
            disabled={!session}
            onClick={handleMic}
          >
            <Mic size={18} />
          </button>
          <input
            id="chat-text-input"
            value={inputValue}
            disabled={!session}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="의사 발화를 입력하세요"
          />
          <button type="button" id="btn-send-message" disabled={!session} onClick={handleSend}>
            <Send size={18} />
          </button>
        </div>
      </div>

      <aside className="emotion-panel">
        <h3>환자 상태 및 AI 튜터</h3>
        <p id="emotion-status-desc">{emotionDesc}</p>
      </aside>
    </div>
  );
}
