# Medi-CPX React Fullstack

기존 컴포넌트 구조 버전에 다음 기능을 붙인 버전입니다.

- SQLite DB 연결
- JWT 로그인/회원가입
- 연습 이력 DB 저장/삭제
- 시나리오/루브릭 DB 조회 및 수정 저장
- AI 표준환자 API 연결
- OpenAI API 키가 없을 때 기존 키워드 기반 fallback 응답 유지

## 실행 방법

```bash
npm install
cp .env.example .env
npm run dev:full
```

프론트엔드: http://localhost:5173  
백엔드 API: http://localhost:4000/api

## 기본 로그인 계정

```txt
이메일: demo@medirole.kr
비밀번호: demo1234
```

## AI API 연결

`.env` 파일에 OpenAI API 키를 넣으면 연습실 환자 응답이 AI API로 생성됩니다.

```env
OPENAI_API_KEY=여기에_API_KEY_입력
OPENAI_MODEL=gpt-4o-mini
```

키를 비워두면 서버가 자동으로 기존 시나리오 `script.dialogs` 기반 키워드 응답을 반환합니다.

## 주요 파일 구조

```txt
src/
├─ App.jsx                         # 로그인 상태, DB 데이터 로딩, 전체 페이지 연결
├─ api/client.js                   # 프론트엔드 API 요청 모듈
├─ pages/LoginPage.jsx             # 로그인/회원가입 화면
├─ pages/PracticeRoom.jsx          # AI 표준환자 API 호출 연결
├─ pages/RubricAdmin.jsx           # 루브릭 DB 저장 연결
├─ pages/SettingsPage.jsx          # 학습 이력 DB 삭제 연결
└─ ...

server/
├─ src/index.js                    # Express API 서버
├─ src/db.js                       # SQLite 연결 및 스키마 생성
├─ src/seed.js                     # 초기 시나리오/데모 계정 seed
├─ src/auth.js                     # JWT 인증 미들웨어
├─ src/patientFallback.js          # AI 키 없을 때 fallback 응답
└─ data/medi-cpx.sqlite            # 실행 시 자동 생성되는 DB 파일
```

## API 요약

```txt
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
GET    /api/scenarios
PATCH  /api/scenarios/:id/stats
PUT    /api/scenarios/:id/rubrics
GET    /api/history
POST   /api/history
DELETE /api/history
POST   /api/ai/patient-response
```

## 개발 흐름

1. 사용자가 로그인하면 JWT 토큰을 localStorage에 저장합니다.
2. `App.jsx`가 `/api/scenarios`, `/api/history`를 호출해 DB 데이터를 화면에 반영합니다.
3. 연습실에서 의사 발화를 입력하면 `/api/ai/patient-response`로 시나리오와 대화 맥락을 보냅니다.
4. 서버는 OpenAI API 키가 있으면 AI 응답을 생성하고, 없으면 키워드 fallback 응답을 반환합니다.
5. 세션 종료 시 `/api/history`에 결과를 저장하고 `/api/scenarios/:id/stats`로 시도 횟수/최고 점수를 업데이트합니다.
