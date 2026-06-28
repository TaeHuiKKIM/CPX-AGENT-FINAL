# API 연동 명세서 (API Specification Draft - Enterprise Ver.)

## 1. 개요
본 문서는 프론트엔드와 백엔드 간의 통신을 위한 API 엔드포인트를 정의합니다. 
RESTful API 및 실시간 음성 스트리밍을 위한 WebSocket 통신 규격을 모두 포함합니다.
*   **Base URL**: `/api/v1`
*   **Content-Type**: `application/json`
*   **Authorization**: `Bearer {JWT_TOKEN}`

## 2. Auth API (인증 및 기관)
사용자 가입, 로그인 및 B2B 소속 인증을 담당합니다.

*   `POST /auth/register`
    *   **Body**: `{ "email": "...", "password": "...", "name": "...", "organization_code": "SNU_MED" }`
*   `POST /auth/login`
*   `GET /auth/me`

## 3. Scenarios API (시나리오)
CPX 실습 시나리오 목록 조회 및 선택 기능을 제공합니다.

*   `GET /scenarios`
*   `GET /scenarios/{scenario_id}`

## 4. Sessions API (실습 세션 - 실시간 통신 포함)
진료 연습 시작, 종료 및 대화 제어를 담당합니다.

*   `POST /sessions`
    *   **Description**: 새로운 연습 세션 시작
    *   **Body**: `{ "scenario_id": "uuid", "mode": "LEARNING" | "ACTIVE" | "EXAM" }`
    *   **Response**: `{ "session_id": "uuid", "welcome_message": "어디가 아파서 오셨나요?", "welcome_audio_url": "https://..." }`
*   `WebSocket /sessions/{session_id}/stream` **[NEW]**
    *   **Description**: STT(음성 인식) 및 TTS(음성 합성) 지연시간(Latency) 최소화를 위한 양방향 바이너리 통신.
    *   **Client -> Server (Binary)**: 사용자의 마이크 오디오 청크 스트리밍.
    *   **Server -> Client (JSON & Binary)**: 
        `{ "event": "stt_result", "text": "가족력 있나요?" }`
        `{ "event": "ai_reply", "text": "아버지가 고혈압입니다.", "tutor_guide": "null or string" }`
        *(바이너리로 환자의 대답 음성 청크 실시간 전송)*
*   `PUT /sessions/{session_id}/end`
    *   **Description**: 세션 정상 종료 및 결과 분석(채점) 트리거.

## 5. Feedback & History API (평가 및 결과)
세션 종료 후 채점 결과, 피드백, 그리고 과거 대화 기록을 제공합니다.

*   `GET /feedback/{session_id}`
    *   **Response**: 점수, 강점/약점, Explainable Feedback, 임상 사고과정 시각화 데이터.
*   `GET /sessions/{session_id}/transcript` **[NEW]**
    *   **Description**: 특정 세션의 대화 타임라인 및 음성 파일 경로(`audio_url`) 조회.
*   `GET /dashboard/history` **[NEW]**
    *   **Description**: 사용자의 과거 CPX 연습 목록(날짜, 시나리오, 점수, 모드) 조회.

## 6. Admin API (관리자 전용) **[EXPANDED]**
관리자 전용 데이터베이스 조작 및 모니터링 엔드포인트입니다. (Admin 권한 필수)

*   **Users & Organizations**
    *   `GET /admin/organizations` : B2B 등록 기관 목록 조회
    *   `POST /admin/organizations` : 신규 기관 등록 및 라이선스 발급
    *   `GET /admin/users` : 전체 가입자 및 소속 기관 통계 조회
*   **Scenarios & Rubrics**
    *   `POST /admin/scenarios` : 신규 시나리오(환자 페르소나, 과거력 등) 등록
    *   `PUT /admin/scenarios/{scenario_id}` : 시나리오 수정
    *   `POST /admin/rubrics` : 채점 루브릭(기준표) 생성
    *   `PUT /admin/rubrics/{rubric_id}` : 채점 루브릭 수정 및 버전 업그레이드
