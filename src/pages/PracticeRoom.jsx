import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Send, Square } from 'lucide-react';
import { formatTime } from '../utils/time';
import { speakWithTTS } from '../utils/speech';

export default function PracticeRoom({ scenario, onFinish }) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [timer, setTimer] = useState(600);
  const [rubricsChecked, setRubricsChecked] = useState([]);
  const [emotion, setEmotion] = useState({ anxiety: 70, cooperation: 40, satisfaction: 50 });
  const [emotionDesc, setEmotionDesc] = useState('연습을 시작하면 환자의 정서 상태가 반영됩니다.');
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef(messages);
  const checkedRef = useRef(rubricsChecked);
  const emotionRef = useRef(emotion);
  const timerRef = useRef(timer);

  useEffect(() => {
    messagesRef.current = messages;
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    checkedRef.current = rubricsChecked;
  }, [rubricsChecked]);

  useEffect(() => {
    emotionRef.current = emotion;
  }, [emotion]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  const resetRoom = useCallback(() => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop?.();
    setSession(null);
    setMessages([]);
    setInputValue('');
    setTimer(600);
    setRubricsChecked([]);
    setEmotion({ anxiety: 70, cooperation: 40, satisfaction: 50 });
    setEmotionDesc('연습을 시작하면 환자의 정서 상태가 반영됩니다.');
    setIsListening(false);
  }, []);

  useEffect(() => {
    resetRoom();
  }, [resetRoom, scenario.id]);

  const appendMessage = useCallback((speaker, text) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { speaker, text, time }]);
  }, []);

  const processDoctorInput = useCallback(
    (text) => {
      if (!session || !text.trim()) return;

      const doctorText = text.trim();
      appendMessage('doctor', doctorText);

      const checkedSet = new Set(checkedRef.current);
      let { anxiety, cooperation, satisfaction } = emotionRef.current;

      scenario.rubrics.forEach((rubric) => {
        const hasMatch = rubric.keyword.some((kw) => doctorText.includes(kw));
        if (hasMatch && !checkedSet.has(rubric.id)) {
          checkedSet.add(rubric.id);
          anxiety = Math.max(10, anxiety - 15);
          cooperation = Math.min(100, cooperation + 20);
          satisfaction = Math.min(100, satisfaction + 15);
        }
      });

      if (['무서', '걱정', '괜찮', '안심'].some((kw) => doctorText.includes(kw))) {
        anxiety = Math.max(10, anxiety - 25);
        satisfaction = Math.min(100, satisfaction + 20);
        setEmotionDesc('의사의 정서적 공감으로 환자의 불안이 많이 완화되었습니다.');
      } else {
        setEmotionDesc('환자가 질문에 차근차근 대답하고 있습니다.');
      }

      const newChecked = [...checkedSet];
      checkedRef.current = newChecked;
      setRubricsChecked(newChecked);
      setEmotion({ anxiety, cooperation, satisfaction });

      const matchedNode = scenario.script.dialogs.find((dialog) => dialog.keywords.some((kw) => doctorText.includes(kw)));
      const responseText = matchedNode?.response ?? scenario.script.fallback;

      window.setTimeout(() => {
        appendMessage('patient', responseText);
        speakWithTTS(responseText);
      }, 800);
    },
    [appendMessage, scenario, session]
  );

  const startSession = () => {
    const started = {
      scenarioId: scenario.id,
      startTime: new Date().toISOString()
    };
    setSession(started);
    setMessages([]);
    setRubricsChecked([]);
    setTimer(600);
    setEmotion({ anxiety: 70, cooperation: 40, satisfaction: 50 });
    setEmotionDesc('환자가 질문에 차근차근 대답하고 있습니다.');
    appendMessage('patient', scenario.script.initial);
    speakWithTTS(scenario.script.initial);
  };

  const stopSession = useCallback(() => {
    if (!session) return;

    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel();

    const checkedCount = checkedRef.current.length;
    const totalCount = scenario.rubrics.length;
    const baseScore = Math.round((checkedCount / totalCount) * 80);
    const ppiBonus = Math.round((emotionRef.current.satisfaction / 100) * 20);
    const totalScore = baseScore + ppiBonus;
    const ppiGrade = totalScore >= 90 ? '최우수(S)' : totalScore >= 80 ? '우수(A)' : '보통(B)';

    const record = {
      id: `h${Date.now()}`,
      scenarioId: scenario.id,
      date: new Date().toLocaleString('ko-KR', { hour12: false }).substring(0, 16),
      duration: formatTime(600 - timerRef.current),
      ratio: '48:52',
      satisfaction: emotionRef.current.satisfaction,
      ppi: ppiGrade,
      score: totalScore,
      checkedRubrics: [...checkedRef.current],
      transcript: [...messagesRef.current]
    };

    resetRoom();
    onFinish(record, totalScore);
  }, [onFinish, resetRoom, scenario.id, scenario.rubrics.length, session]);

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
      // 이미 listening 중일 때 발생하는 예외 방지
    }
  };

  return (
    <div className="practice-page">
      <div className="practice-patient-card">
        <h2 id="practice-patient-name">
          {scenario.patientName} ({scenario.age}세/{scenario.gender})
        </h2>
        <p id="practice-patient-tag">{scenario.tag}</p>
        <div className="patient-info-line">
          <strong>CC</strong> <span id="practice-patient-cc">{scenario.cc}</span>
        </div>
        <div className="patient-info-line">
          <strong>VS</strong> <span id="practice-patient-vs">{scenario.vs}</span>
        </div>
        <p id="practice-patient-notes">{scenario.notes}</p>
        <ul id="practice-patient-goals">
          {scenario.goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
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
              <p className="sub-text">마이크를 활성화하여 음성으로 질문하거나 키보드로 직접 텍스트를 입력할 수 있습니다.</p>
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
        <h3>환자 정서 상태</h3>
        <EmotionGauge label="불안" value={emotion.anxiety} className="anxiety" />
        <EmotionGauge label="협조도" value={emotion.cooperation} className="coop" />
        <EmotionGauge label="만족도" value={emotion.satisfaction} className="satisfaction" />
        <p id="emotion-status-desc">{emotionDesc}</p>
      </aside>
    </div>
  );
}

function EmotionGauge({ label, value, className }) {
  return (
    <div className="emotion-gauge-row">
      <span>{label}</span>
      <div className="emotion-track">
        <div id={`emotion-${className}-bar`} className={`emotion-fill ${className}`} style={{ width: `${value}%` }} />
      </div>
      <strong>{value}%</strong>
    </div>
  );
}
