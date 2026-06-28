# Medi-CPX (SPAI-CPX-AGENT) 🩺

AI 기반 표준환자 진료(CPX) 연습 및 자동 채점 플랫폼입니다. 의과대학생 및 의료진이 언제 어디서든 AI 환자와 음성으로 진료 상황을 연습하고, 상세한 피드백과 채점 결과를 받아볼 수 있습니다.

## ✨ 주요 기능

*   **🔐 사용자 인증**: Supabase를 활용한 회원가입, 로그인 및 세션 관리
*   **🗣️ 실전 같은 진료 연습 (Practice Room)**: 
    *   사용자의 마이크 음성을 인식하여 텍스트로 변환 (STT)
    *   AI 표준환자(LLM)가 실시간으로 대답하고 반응
    *   10분 타이머 제공으로 실전 CPX 시험과 동일한 환경 구성
*   **📊 AI 평가 및 피드백**:
    *   진료 종료 시 백엔드(FastAPI)에서 대화 기록(Transcript)을 바탕으로 채점
    *   루브릭(Rubric)에 따른 병력청취, 의사소통(PPI), 설명 및 교육 점수 산출
    *   강점, 약점, 진단 추론 흐름 등 상세한 피드백 제공
*   **📈 대시보드 및 통계**:
    *   최근 10회 평균 역량을 레이더 차트로 시각화
    *   진료 케이스별 달성도 및 연습 이력 관리

## 🛠️ 기술 스택

### Frontend
*   **Framework**: React (Vite)
*   **Styling**: Custom CSS (Vanilla, 모던 글래스모피즘 & UI/UX 적용)
*   **State & Routing**: React Hooks
*   **Charts & Icons**: Chart.js, Lucide-React

### Backend & AI
*   **Framework**: FastAPI (Python)
*   **LLM Integration**: OpenAI GPT / Google Gemini (프롬프트 엔지니어링 및 환자 페르소나 적용)
*   **Realtime**: WebSockets (실시간 음성/텍스트 스트리밍 대응)

### Database & Auth
*   **BaaS**: Supabase (PostgreSQL)
*   **Auth**: Supabase Auth (Email/Password)
*   **Security**: Row Level Security (RLS) 적용

## 🚀 로컬 실행 방법 (Getting Started)

### 1. 환경 변수 설정
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 값을 채워주세요.
```env
# Supabase 설정
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# AI 설정
OPENAI_API_KEY=your_openai_api_key
```

### 2. 데이터베이스 설정 (Supabase)
Supabase 대시보드의 **SQL Editor**에서 `supabase/schema.sql` 파일의 내용을 복사하여 실행합니다. 
*(이 스크립트는 기존 테이블과 충돌하지 않도록 `IF NOT EXISTS`가 적용되어 있습니다.)*

### 3. 패키지 설치 및 서버 실행

#### Frontend (React)
```bash
# 패키지 설치
npm install

# 프론트엔드 개발 서버 실행 (기본 포트: 5173)
npm run dev
```

#### Backend (FastAPI)
```bash
# 파이썬 가상환경 생성 및 활성화
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# 의존성 패키지 설치
pip install -r requirements.txt

# 백엔드 서버 실행 (기본 포트: 8000)
python -m uvicorn main:app --port 8000 --reload
```

## 📝 라이선스
This project is licensed under the MIT License.
