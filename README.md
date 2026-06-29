# 🩺 MediCPX (메디CPX)

> **의대생을 위한 완벽한 AI 표준화환자 발열 실습 플랫폼**
> AI와 문진하고, 실제 같은 신체진찰 플로우를 경험하며, 40개 항목의 정밀한 Yes/No 채점을 받아보세요!

<div align="center">
  <img width="800" alt="dashboard" src="https://github.com/user-attachments/assets/35fb78fc-c064-4a8c-b3c7-edbc11e387c3" />
</div>

---

## 🌟 프로젝트 소개 (Why MediCPX?)

기존의 챗봇형 연습은 단순히 대화만 가능할 뿐, "제한된 시간 내에 필요한 절차를 수행하고 올바른 도구를 사용했는가?"라는 실제 CPX(임상수행능력평가)의 핵심을 반영하지 못했습니다.

**MediCPX**는 AI 표준화환자가 **정보를 함부로 누설하지 않도록** 제어하고, 체위 변경과 도구 선택에 따른 **가상 시간 손실**까지 완벽하게 구현한 혁신적인 학습 플랫폼입니다.

---

## 📸 핵심 화면 (Screen Flows)

| 시나리오 라이브러리 | 실시간 연습실 |
| :---: | :---: |
| <img width="400" alt="scenario-library" src="https://github.com/user-attachments/assets/b15d5591-e555-4a98-8115-6fd1fdc2c9d4" /> | <img width="400" alt="practice-room" src="https://github.com/user-attachments/assets/1b6e2540-2280-4a35-90de-68540f339499" /> |
| 8가지 발열 케이스 및 맞춤형 학습 | 실시간 음성(STT/TTS) 기반 문진 및 진찰 |

| 신체진찰 플로우 모듈 | AI 성과 리포트 |
| :---: | :---: |
| <img width="400" alt="physical-exam" src="https://github.com/user-attachments/assets/87129f0d-5cc0-4845-8bf5-bfdbe3ad493c" /> | <img width="400" alt="performance-report" src="https://github.com/user-attachments/assets/b15c758d-42bc-4f4d-b13c-312bc43a7215" /> |
| 순서, 도구, 손소독 등 상세 기록 반영 | 40개 체크리스트 자동 채점 및 피드백 |

---

## 🔥 핵심 기능 (Key Features)

### 1. 🤫 "묻기 전엔 말하지 않는다" - 깐깐한 AI 표준화환자
- 환자는 주소(Chief Complaint)만 먼저 말합니다.
- 학생이 정확하게 과거력, 사회력, 가족력을 묻지 않으면 **절대 먼저 정보를 누설하지 않습니다.**
- **Web Speech API**를 활용한 실시간 음성(STT) 및 텍스트 동시 입력 지원.

### 2. ⏳ 리얼타임 신체진찰 플로우 (타임어택 구현)
실제 시험과 동일하게 **12분(720초)**의 제한 시간이 주어지며, 신체진찰 중의 액션에 따라 시간이 즉시 차감됩니다.
- **체위 변경**: 앙와위, 좌위 등 변경 시 **2초 즉시 차감** (스피너 애니메이션 제공)
- **일반 진찰**: 단순 시진, 청진 등 수행 시 **5초 즉시 차감**
- **환자 협조 진찰**: 심호흡, CVAT, 간/비장 촉진 등 수행 시 **10초 즉시 차감**
- 청진기, 펜라이트 등의 **도구 선행 선택** 로직 및 **손소독(입실/접촉전/종료후) 체크 기능** 탑재.

### 3. 🎯 명확하고 빠른 40항목 Yes/No 자동 채점
애매한 가중치나 부분점수는 과감히 배제했습니다.
- 실제 국시 발열 채점표와 동일한 **40개 체크리스트** 사용.
- 각 항목당 2.5점으로 오직 **Yes/No**로만 채점하여 투명성을 확보.
- **속도 최적화**: LLM(Gemini)은 수다를 떨지 않고 오직 `Yes` 항목 번호와 근거만 짧게 반환하며, 나머지 No 항목은 백엔드 서버가 초고속으로 복원·정규화합니다.

### 4. 📝 '이유'가 있는 피드백 리포트
단순히 "감점"만 표시하지 않습니다.
- 왜 해당 항목을 물어봐야 했는지 (예: "말라리아, 장티푸스 감별을 위해 여행력이 필요했습니다") 상세한 이유 제공.
- 만약의 채점 서버 지연/오류 시에도 학생의 대화 기록이 유실되지 않는 **채점 실패 복구 리포트** 기능 탑재.

---

## 🛠 기술 스택 (Tech Stack)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)

- **Frontend**: React, Vite, Chart.js, Lucide React, Web Speech API
- **Backend**: FastAPI, Uvicorn, WebSocket 실시간 통신
- **Database & Auth**: Supabase PostgreSQL, Auth, Row Level Security (RLS)
- **AI Engine**: Google Gemini 2.5 Flash Lite (Structured Output 적용)

---

## 📂 새롭게 정리된 프로젝트 구조
복잡했던 프로젝트 문서를 `docs/` 내 폴더로 체계화했습니다.

```text
.
├─ backend/             # FastAPI 서버 및 WebSocket 핸들러
├─ docs/
│  ├─ 01_Planning/      # 마스터 기획서, 발표 대본, QA 문서
│  ├─ 02_Requirements_and_Design/ # API 명세서, 사용자 플로우
│  ├─ 03_Medical_Content/ # 8종 발열 케이스 및 Yes/No 40항목 채점표
│  ├─ 04_AI_and_Evaluation/ # AI 프롬프트 및 채점 루브릭 명세
│  └─ 05_Archive/       # 과거 백업 자료 보관함
├─ src/                 # React 프론트엔드 소스코드
├─ supabase/            # DB 스키마 (schema.sql)
├─ Dockerfile           # Cloudtype 단일 배포용 도커파일
└─ package.json
```

---

## 🚀 로컬 실행 방법 (Local Setup)

프로젝트 루트에 `.env` 파일을 만들고 아래 환경변수를 채워주세요. (Git에 올리지 마세요!)

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

**설치 및 실행 터미널 가이드**
```bash
# 1. 패키지 설치
npm install
cd backend && pip install -r requirements.txt

# 2. 백엔드 서버 실행 (포트 8001)
python -m uvicorn main:app --host 127.0.0.1 --port 8001

# 3. 프론트엔드 서버 실행 (포트 5173, 새 터미널 창에서)
npm run dev -- --host 127.0.0.1 --port 5173
```
*프론트엔드 설정(`vite.config.js`)에 의해 `/api` 및 웹소켓 경로는 자동으로 `8001` 포트로 프록시됩니다.*

---

## ☁️ Cloudtype 배포 전략
현재 이 레포지토리는 `Dockerfile` 하나로 프론트엔드를 빌드한 뒤, FastAPI가 **정적 파일과 API/WebSocket을 동시에 서빙**하는 원-서버 구조로 최적화되어 있습니다. Cloudtype 배포 시, 포트를 `8000`으로 설정하고 환경 변수만 기입하시면 빠르고 안정적으로 배포가 완료됩니다!
