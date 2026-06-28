# CPX-AGENT-FINAL

AI 표준화환자 기반 CPX 발열 케이스 실습 플랫폼입니다. 학생은 AI 환자와 문진하고, 별도 신체진찰 모듈에서 체위 변경, 손소독, 기물 선택, 청진/타진/촉진/수기 진찰을 수행한 뒤, 발열 CPX 40개 체크리스트 기준으로 Yes/No 자동 채점을 받습니다.

## 작동 사진
<img width="2860" height="1386" alt="image" src="https://github.com/user-attachments/assets/35fb78fc-c064-4a8c-b3c7-edbc11e387c3" />

<img width="2874" height="1438" alt="image" src="https://github.com/user-attachments/assets/b15d5591-e555-4a98-8115-6fd1fdc2c9d4" />

<img width="2098" height="1402" alt="image" src="https://github.com/user-attachments/assets/1b6e2540-2280-4a35-90de-68540f339499" />

<img width="2832" height="1442" alt="image" src="https://github.com/user-attachments/assets/87129f0d-5cc0-4845-8bf5-bfdbe3ad493c" />

<img width="2828" height="1442" alt="image" src="https://github.com/user-attachments/assets/b15c758d-42bc-4f4d-b13c-312bc43a7215" />

## 주요 기능

- Supabase Auth 기반 로그인/회원가입
- AI 표준화환자 WebSocket 대화
- 브라우저 STT/TTS 및 텍스트 입력 지원
- 신체진찰 플로우 모듈
  - 시험 세션 제한 시간 12분
  - 체위 변경 2초 로딩 및 즉시 시간 차감
  - 일반 진찰 5초, 환자 협조 진찰 10초 즉시 차감
  - 청진기 등 기물 선택, 손소독, 복부 4분면 선택
  - 수행 소견을 대화 기록과 채점 로그에 반영
- 발열 CPX 40개 항목 Yes/No 자동 채점
- 결과 리포트
  - 총점, Yes 항목 수, 영역별 레이더 차트
  - 잘한 점, 보완할 점, 상세 피드백
  - 40개 체크리스트와 근거 문장

## 기술 스택

### Frontend

- React
- Vite
- Chart.js
- Lucide React
- Supabase JS Client

### Backend

- FastAPI
- Uvicorn
- WebSocket
- Google Gemini API
- Supabase Python Client

### Database/Auth

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security

## 프로젝트 구조

```text
.
├─ backend/
│  ├─ main.py
│  ├─ api/
│  ├─ core/
│  └─ services/
├─ docs/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ data/
│  ├─ pages/
│  └─ styles/
├─ supabase/
│  └─ schema.sql
├─ package.json
├─ vite.config.js
└─ README.md
```

## 환경 변수

프로젝트 루트에 `.env`를 만들고 아래 값을 설정합니다. `.env`는 Git에 올리지 않습니다.

```env
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 로컬 개발 시 Vite proxy를 쓰면 아래 값은 비워두거나 기본값으로 둡니다.
VITE_API_BASE_URL=/api
VITE_FASTAPI_BASE_URL=/api/v1
VITE_FASTAPI_WS_URL=

# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

프론트와 백엔드를 분리 배포하는 경우 프론트 환경변수를 아래처럼 설정합니다.

```env
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_FASTAPI_BASE_URL=https://your-backend-domain/api/v1
VITE_FASTAPI_WS_URL=wss://your-backend-domain/api/v1
```

단일 Dockerfile 배포에서는 컨테이너 시작 시 `/env.js`가 생성되어 Cloudtype 런타임 환경변수를 프론트가 읽습니다. 그래도 `VITE_` 값은 Cloudtype 환경변수에 함께 등록해 두는 것을 권장합니다.

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
cd backend
pip install -r requirements.txt
```

### 2. Supabase 스키마 적용

Supabase Dashboard의 SQL Editor에서 아래 파일 내용을 실행합니다.

```text
supabase/schema.sql
```

현재 앱은 `scen-fever-5`처럼 문자열 기반 시나리오 ID를 사용합니다. `backend/schema.sql`은 예전 UUID 기반 설계 참고용이므로 새 Supabase 프로젝트에는 적용하지 마세요.

로그인 후 연습 시작 시 브라우저 콘솔에 `DB Session insert failed, falling back to local session`이 보이면 Supabase 스키마 또는 RLS 정책이 현재 앱과 맞지 않는 상태입니다. 이 경우 `supabase/schema.sql`을 다시 실행한 뒤 재배포/새로고침해서 확인합니다.

### 3. 백엔드 실행

백엔드는 `backend` 폴더에서 실행해야 루트 `.env`를 올바르게 읽습니다.

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

헬스체크:

```text
http://127.0.0.1:8001/health
```

### 4. 프론트엔드 실행

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

접속:

```text
http://127.0.0.1:5173/
```

로컬에서는 `vite.config.js`가 `/api` 요청과 WebSocket을 `127.0.0.1:8001` 백엔드로 프록시합니다.

## Cloudtype 배포 가이드

### 단일 서비스 Dockerfile 배포

현재 레포는 루트 `Dockerfile`로 프론트엔드를 빌드한 뒤 FastAPI가 `dist` 정적 파일과 `/api/v1` API/WebSocket을 함께 서빙합니다. Cloudtype 서비스 하나로 프론트와 백엔드를 함께 배포할 수 있습니다.

- Git Repository: `https://github.com/TaeHuiKKIM/CPX-AGENT-FINAL.git`
- Branch: `master`
- Build Type: `Dockerfile`
- Dockerfile Path: `Dockerfile`
- Port: `8000`
- Start Command: 비워두기

Environment Variables:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=/api
VITE_FASTAPI_BASE_URL=/api/v1
VITE_FASTAPI_WS_URL=
```

프론트와 백엔드를 같은 Cloudtype 서비스에서 띄우는 경우 `VITE_API_BASE_URL`, `VITE_FASTAPI_BASE_URL`, `VITE_FASTAPI_WS_URL`은 위 값 그대로 두면 현재 접속 도메인을 기준으로 연결됩니다.

배포 후 아래 경로를 확인합니다.

```text
https://your-cloudtype-domain/health
https://your-cloudtype-domain/env.js
```

`/env.js`에 `your-project-url` 같은 placeholder가 보이면 Cloudtype 환경변수 값이 잘못 들어갔거나 이전 revision이 배포된 상태입니다.

Cloudtype에서는 프론트와 백엔드를 서비스 2개로 나누는 구성을 권장합니다.

### 1. Backend 서비스

- 서비스 이름 예시: `spai-cpx-api`
- Root Directory: `backend`
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

- Environment Variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

배포 후 아래 경로가 정상 응답해야 합니다.

```text
https://your-backend-domain/health
```

### 2. Frontend 서비스

- 서비스 이름 예시: `spai-cpx-web`
- Root Directory: repository root
- Build Command:

```bash
npm install && npm run build
```

- Output Directory: `dist`
- SPA Mode: enabled
- Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_FASTAPI_BASE_URL=https://your-backend-domain/api/v1
VITE_FASTAPI_WS_URL=wss://your-backend-domain/api/v1
```

환경변수를 바꾸면 프론트는 다시 빌드/배포해야 합니다.

## 보안 주의

- Cloudtype 환경변수에 API 키를 넣는 것은 일반적인 서버 배포 방식입니다. 단, Cloudtype 프로젝트/팀 권한이 있는 사람은 값을 볼 수 있으므로 접근 권한을 최소화합니다.
- `GEMINI_API_KEY`와 `SUPABASE_KEY(service_role)`는 서버 전용 비밀값입니다. 절대 `VITE_` 접두사를 붙이지 않습니다.
- 프론트에는 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`만 넣습니다. Supabase anon key는 공개 클라이언트 키이므로 RLS 정책으로 DB 접근을 보호해야 합니다.
- `SUPABASE_KEY`에는 service_role key를 넣을 수 있지만, 이 키는 RLS를 우회할 수 있으므로 Cloudtype 서버 환경변수에만 저장합니다.
- `.env`, 로그 파일, DB 파일, 빌드 산출물, `node_modules`는 Git에 올리지 않습니다.
- 키가 GitHub에 노출된 적이 있다면 즉시 재발급하고 기존 키를 폐기해야 합니다.

## 채점 방식

- 기준: 발열 CPX 체크리스트 40개 항목
- 판정: Yes/No
- 점수: `Yes 개수 / 40 * 100`
- 가중치/부분점수 없음
- LLM은 Yes 항목 번호와 짧은 근거만 반환하고, 서버가 전체 40개 결과를 복원합니다.

## 개발 확인 명령

```bash
npm run build
python -m py_compile backend/api/websockets/session.py backend/services/evaluation_service.py backend/services/llm_service.py backend/services/supabase_db.py
```
