# CPX-AGENT-FINAL

AI 표준화환자 기반 CPX 발열 케이스 실습 플랫폼입니다. 학생은 AI 환자와 문진하고, 별도 신체진찰 모듈에서 체위 변경, 손소독, 기물 선택, 청진/타진/촉진/수기 진찰을 수행한 뒤, 발열 CPX 40개 체크리스트 기준으로 Yes/No 자동 채점을 받습니다.

## 📸 작동 사진

대시보드, 시나리오, 연습실, 신체진찰, 성과 리포트 화면 흐름입니다.

<img width="2860" height="1386" alt="dashboard" src="https://github.com/user-attachments/assets/35fb78fc-c064-4a8c-b3c7-edbc11e387c3" />

<img width="2874" height="1438" alt="scenario-library" src="https://github.com/user-attachments/assets/b15d5591-e555-4a98-8115-6fd1fdc2c9d4" />

<img width="2098" height="1402" alt="practice-room" src="https://github.com/user-attachments/assets/1b6e2540-2280-4a35-90de-68540f339499" />

<img width="2832" height="1442" alt="physical-exam" src="https://github.com/user-attachments/assets/87129f0d-5cc0-4845-8bf5-bfdbe3ad493c" />

<img width="2828" height="1442" alt="performance-report" src="https://github.com/user-attachments/assets/b15c758d-42bc-4f4d-b13c-312bc43a7215" />

## 🌟 핵심 및 상세 기능

### 1. 사용자 및 대시보드
- **Supabase Auth** 기반 로그인/회원가입
- 개인화 대시보드 제공 및 오늘 일정 기반 연습 진입 기능

### 2. 문진 (AI 표준화환자)
- **실시간 WebSocket 통신**을 통한 AI 표준화환자 대화 (Gemini 2.5 Flash Lite 적용)
- 브라우저 기본 Web Speech API를 활용한 **STT(음성인식) / TTS(음성합성)** 및 텍스트 입력 동시 지원
- 8가지 발열 케이스 시나리오 라이브러리 제공 (`scen-fever-1` ~ `scen-fever-8`)
- **타이머 기능**: 실제 시험과 동일한 세션 제한 시간 **12분(720초)** 적용

### 3. 신체진찰 모듈 (Physical Exam)
신체진찰 수행 시 **가상 시간이 즉시 차감**되어 실제 시험의 타임어택 압박감을 구현했습니다.

- **체위 변경**: 앙와위, 좌위, 측와위, 기립 등 체위 변경 시 **2초 즉시 차감** (UI상 2초 스피너 로딩 제공)
- **일반 진찰**: 환자의 특별한 협조가 필요 없는 진찰 (예: 시진, 청진) 수행 시 **5초 즉시 차감**
- **환자 협조 진찰**: 심호흡, 체위 유지 등 환자의 협조가 필수적인 진찰 (예: Murphy sign, CVAT, 간/비장 촉진 등) 수행 시 **10초 즉시 차감**
- **기물 및 위생 관리**:
  - 청진기, 펜라이트, 반사망치, 혈압계 등 진찰 장비 선행 선택 로직
  - 손소독 시점 판단 (입실, 접촉 전, 종료 후) - 접촉 진찰 전 손소독 누락 시 감점 요인 기록
- **부위 특정**: 복부 진찰 시 4분면(RUQ, LUQ, RLQ, LLQ)을 정확히 특정하여 촉진해야 상세 소견 확인 가능
- **진찰 순서 강제**: 복부의 경우 '청진'을 먼저 수행하지 않고 '타진/촉진' 시도 시 순서 위반 로그 기록
- 수행된 모든 내역은 타임라인 형태로 기록되며 채점 API로 전달됩니다.

### 4. 자동 채점 및 성과 리포트
- **기준**: 발열 CPX 체크리스트 40개 항목
- **판정 및 점수**: 항목당 2.5점 (총점 100점). LLM이 근거와 함께 항목별 Yes/No 판단 (부분점수 없음)
- **리포트 구성**:
  - 총점, Yes 항목 수, 6개 영역별 레이더 차트 분석
  - AI 상세 피드백 (잘한 점, 보완할 점, 종합 의견)
  - 40개 전체 체크리스트의 채점 결과와 AI가 판단한 근거 문장 제시
  - **오류 복구 리포트**: 채점 서버 지연/오류 발생 시에도 학생의 대화 기록 및 신체진찰 내역을 보존하는 '채점 실패 리포트' 자동 생성 기능

## 🔄 사용자 플로우

1. 로그인 또는 회원가입
2. 대시보드 또는 시나리오 라이브러리에서 케이스 선택 (학습/시험 모드)
3. 연습실 입장 후 AI 표준화환자와 음성/채팅으로 문진
4. 우측 상단의 신체진찰 모달을 열어 체위 설정, 손소독, 진찰 도구 선택 후 각 부위 진찰 (수행 시 메인 타이머 시간 즉시 차감)
5. '진료 종료' 버튼 클릭 시 전체 Transcript와 진찰(PE) 로그가 FastAPI 서버로 전달
6. 채점 완료 후 제공되는 성과 리포트에서 Yes/No 피드백과 레이더 차트 확인

## 🛠 기술 스택

### Frontend
- **React, Vite**
- **Chart.js** (방사형 차트)
- **Lucide React** (아이콘)
- **Web Speech API** (브라우저 내장 STT/TTS)
- **Supabase JS Client**

### Backend
- **FastAPI, Uvicorn**
- **WebSocket** (실시간 양방향 스트리밍)
- **Google Gemini API** (LLM 프롬프팅 및 평가)
- **Supabase Python Client**

### Database & Auth
- **Supabase Auth** / **PostgreSQL** / **Row Level Security (RLS)**

## 📂 프로젝트 구조

```text
.
├─ backend/
│  ├─ main.py
│  ├─ api/
│  ├─ core/
│  └─ services/
├─ docs/
│  ├─ backend/
│  └─ breakthough/
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ data/
│  ├─ pages/
│  └─ styles/
├─ supabase/
│  └─ schema.sql
├─ Dockerfile
├─ package.json
├─ vite.config.js
└─ README.md
```

## ⚙️ 로컬 실행 및 환경 변수

### 1. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 아래와 같이 작성합니다. (Git에는 절대 포함하지 않습니다)

```env
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=/api
VITE_FASTAPI_BASE_URL=/api/v1
VITE_FASTAPI_WS_URL=

# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 2. 패키지 설치
```bash
npm install
cd backend
pip install -r requirements.txt
```

### 3. Supabase 스키마 적용
Supabase Dashboard의 SQL Editor에서 `supabase/schema.sql` 내용을 복사하여 실행합니다.

### 4. 로컬 서버 실행
**Backend (터미널 1)**
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8001
# 헬스체크: http://127.0.0.1:8001/health
```

**Frontend (터미널 2)**
```bash
npm run dev -- --host 127.0.0.1 --port 5173
# 접속: http://127.0.0.1:5173/
```
(프론트엔드 Vite 설정에서 `/api` 경로를 백엔드 8001 포트로 자동 프록시합니다.)

## 🚀 Cloudtype 배포
본 저장소는 `Dockerfile` 하나로 프론트엔드 빌드 후 FastAPI를 통해 정적 파일 서빙 및 API를 통합 서빙하도록 구성되어 있습니다.

| 항목 | 설정 값 |
|---|---|
| Git Repository | `https://github.com/TaeHuiKKIM/CPX-AGENT-FINAL.git` |
| Branch | `master` |
| Build Type | `Dockerfile` |
| Port | `8000` |

Cloudtype 환경 변수 설정 시, 프론트엔드와 백엔드 환경 변수들을 모두 기입하며, 특히 서버 전용 시크릿(API 키, Service Role 키)이 노출되지 않도록 주의해야 합니다.
