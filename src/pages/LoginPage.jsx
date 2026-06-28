import { useState } from 'react';

export default function LoginPage({ onLogin, onRegister, loading }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('김하나');
  const [email, setEmail] = useState('demo@medirole.kr');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister({ name, email, password });
      }
    } catch (err) {
      let errMsg = '로그인에 실패했습니다.';
      if (err instanceof Error) errMsg = err.message;
      else if (typeof err === 'string') errMsg = err;
      else if (err && err.message) errMsg = err.message;
      else if (typeof err === 'object') errMsg = JSON.stringify(err);
      
      if (errMsg === '{}') errMsg = '서버 응답 오류 (테이블 미생성 등)';
      setError(errMsg);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-logo">
          <span><img src="/brand/medirole-symbol.png" alt="" /></span>
          <div>
            <img className="auth-wordmark" src="/brand/medirole-wordmark.png" alt="medirole" />
            <p>AI 표준환자 CPX 연습 플랫폼</p>
          </div>
        </div>

        <h1>{mode === 'login' ? '로그인' : '회원가입'}</h1>
        <p className="auth-help">DB 연동 확인용 기본 계정: demo@medirole.kr / demo1234</p>

        {mode === 'register' && (
          <label>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
          </label>
        )}

        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
        </label>

        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
        </label>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인하기' : '가입하고 시작하기'}
        </button>

        <button type="button" className="auth-mode-toggle" onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}>
          {mode === 'login' ? '새 계정 만들기' : '이미 계정이 있어요'}
        </button>
      </form>
    </div>
  );
}
