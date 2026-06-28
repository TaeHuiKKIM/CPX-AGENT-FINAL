# SPAI-CPX-AGENT (Medi-CPX AI 플랫폼)

의과대학 실기시험(CPX) 대비를 위한 **AI 표준환자 대화형 실습 플랫폼**입니다.
React(Vite) 기반의 프론트엔드와 FastAPI 기반의 백엔드(Gemini 2.5 Flash 연동)가 실시간 웹소켓(WebSocket)으로 통신하며, 즉각적인 음성/텍스트 응답을 제공합니다.

---

## 🛠 기술 스택
- **Frontend**: React 18, Vite, Supabase-js, Lucide-react
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Google GenAI (Gemini 2.5 Flash), WebSocket
- **Database**: Supabase (PostgreSQL)

---

## ⚙️ 설치 및 설정 방법

이 프로젝트는 **프론트엔드(Node.js)**와 **백엔드(Python)** 두 가지 환경을 모두 설정해야 합니다.

### 1. 환경 변수 (.env) 설정
프로젝트 최상단(루트 디렉터리)에 `.env` 파일을 생성하고 아래 내용을 입력합니다.
(기존 `.env`가 있다면 `GEMINI_API_KEY`가 정확한지 확인하세요.)

```env
# AI API
GEMINI_API_KEY="여러분의_GEMINI_API_KEY"
GEMINI_MODEL="gemini-2.5-flash"

# Supabase
VITE_SUPABASE_URL="https://iwqqiyntomqsuhblgacr.supabase.co"
VITE_SUPABASE_ANON_KEY="여러분의_SUPABASE_ANON_KEY"

# Backend & WebSocket
VITE_FASTAPI_WS_URL=ws://localhost:8000/api/v1
VITE_FASTAPI_BASE_URL=http://localhost:8000/api/v1
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

### 2. 백엔드 (FastAPI) 설치
루트 디렉터리에서 `backend` 폴더로 이동하여 가상 환경을 생성하고 패키지를 설치합니다.

```bash
cd backend
python -m venv venv

# Windows의 경우 가상 환경 활성화:
venv\Scripts\activate
# Mac/Linux의 경우:
# source venv/bin/activate

pip install -r requirements.txt
```

### 3. 프론트엔드 (React/Vite) 설치
새 터미널을 열고 프로젝트 최상단(루트)에서 의존성 패키지를 설치합니다.

```bash
npm install
```

---

## 🚀 실행 방법

로컬에서 테스트하려면 **2개의 터미널**을 열어 프론트엔드와 백엔드를 각각 실행해야 합니다.

### 터미널 1: 백엔드 서버 실행
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --port 8000 --reload
```
- 성공 시 `ws://localhost:8000/api/v1` 에서 웹소켓 대기 중

### 터미널 2: 프론트엔드 서버 실행
```bash
npm run dev
```
- 성공 시 `http://localhost:5173` 으로 접속 가능

---

## 💡 테스트 가이드 (로그인 우회 모드)
개발 및 데모 테스트의 편의성을 위해 **로그인 없이도 즉시 실습을 시작할 수 있는 로컬 테스트 모드**가 적용되어 있습니다.

1. 브라우저에서 `http://localhost:5173` 접속
2. 좌측 메뉴에서 **실습실(Practice Room)** 또는 대시보드의 시나리오 클릭
3. 화면 중앙의 **[연습 시작]** 버튼 클릭
4. (자동으로 임시 세션 발급 완료) 마이크로 환자에게 첫 인사를 건네거나 텍스트 입력!
   - 예: "안녕하세요, 어디가 불편해서 오셨나요?"

> **참고:** 로그인 없이 진행된 로컬 테스트 세션(`test-session-...`)은 종료 후 Supabase DB에 기록을 저장하거나 평가(Evaluation)를 수행하지 않고 즉시 초기화됩니다. 
