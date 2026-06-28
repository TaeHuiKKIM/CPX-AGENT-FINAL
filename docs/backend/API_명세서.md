# API 연동 명세서 (Supabase + FastAPI Hybrid Ver.)

## 1. 개요 및 통신 아키텍처
본 문서는 프론트엔드와 백엔드 서비스 간의 통신 규격을 정의합니다. 
하이브리드 아키텍처 채택으로 인해, 일반적인 데이터 CRUD는 **Supabase SDK**를 통해 프론트엔드에서 DB와 직접 통신하며, AI 및 실시간 처리가 필요한 핵심 비즈니스 로직만 **FastAPI** 서버를 호출합니다.

## 2. Supabase SDK 연동 범위 (프론트엔드 직접 호출)
아래 기능들은 별도의 백엔드 API 명세 없이, 프론트엔드에서 Supabase Client(예: `@supabase/supabase-js`)를 사용하여 직접 수행합니다. Row Level Security(RLS) 정책에 의해 안전하게 보호됩니다.

*   **인증(Auth)**: 이메일 가입, 로그인, 로그아웃.
*   **시나리오 탐색**: `Scenarios` 테이블 직접 Select (필터링).
*   **대시보드 히스토리 조회**: 본인의 `Sessions`, `Feedback_Results` 테이블 Select.
*   **어드민(Admin) 관리**: 관리자 권한을 가진 계정으로 `Organizations`, `Scenarios`, `Rubrics` 테이블 Insert/Update.
*   **오디오 파일 저장/조회**: 진료 녹음 파일을 Supabase Storage `audio_records` 버킷에 업로드 및 URL 다운로드.

---

## 3. FastAPI 전용 엔드포인트 (AI 통신 및 평가 엔진)
AI 로직(STT/TTS, 프롬프트 파이프라인, 채점 알고리즘) 처리를 위해 프론트엔드가 호출하는 커스텀 백엔드 API입니다.
*   **Base URL**: `wss://[FASTAPI_DOMAIN]/api/v1` (웹소켓) 또는 `https://...`
*   **Authorization**: 헤더에 Supabase에서 발급받은 JWT 토큰 (`Bearer {JWT_TOKEN}`) 첨부.

### 3.1 Sessions API (실시간 실습 세션)

*   `WebSocket /sessions/{session_id}/stream`
    *   **Description**: STT(음성 인식) 및 TTS(음성 합성) 지연시간(Latency) 최소화를 위한 양방향 바이너리 통신.
    *   **Client -> Server (Binary)**: 사용자의 마이크 오디오 청크 스트리밍.
    *   **Server -> Client (JSON & Binary)**: 
        `{ "event": "stt_result", "text": "가족력 있나요?" }`
        `{ "event": "ai_reply", "text": "아버지가 고혈압입니다.", "tutor_guide": "null or string" }`
        *(바이너리로 환자의 대답 음성 청크 실시간 전송)*
    *   **Background Activity**: 통신 중 발생하는 모든 대화(Transcript)를 FastAPI가 백그라운드에서 Supabase DB에 실시간 `INSERT` 합니다.

### 3.2 Feedback API (세션 종료 및 평가 트리거)

*   `POST /feedback/{session_id}/evaluate`
    *   **Description**: 사용자가 실습을 종료했을 때 호출. FastAPI가 해당 세션의 `Transcripts`를 모두 읽어와 AI 루브릭 채점을 돌린 뒤, `Feedback_Results` 테이블에 결과를 `INSERT/UPDATE` 합니다.
    *   **Response**: `{ "status": "processing_started" }` (채점에는 LLM 시간이 소요되므로 비동기로 처리되며, 프론트엔드는 Supabase Realtime으로 `Feedback_Results` 테이블의 삽입 이벤트를 구독하여 화면에 결과를 표시합니다.)
