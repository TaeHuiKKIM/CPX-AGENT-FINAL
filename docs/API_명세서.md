# API 연동 명세서 (API Specification Draft)

## 1. 개요
본 문서는 프론트엔드와 백엔드 간의 통신을 위한 RESTful API 엔드포인트를 정의합니다. 
*   **Base URL**: `/api/v1`
*   **Content-Type**: `application/json`
*   **Authorization**: `Bearer {JWT_TOKEN}`

## 2. Auth API (인증)
사용자 가입, 로그인 및 세션 관리를 담당합니다.

*   `POST /auth/register`
    *   **Description**: 이메일 및 비밀번호 회원가입
    *   **Body**: `{ "email": "...", "password": "...", "name": "...", "grade": 3 }`
*   `POST /auth/login`
    *   **Description**: 로그인 후 JWT 토큰 발급
*   `GET /auth/me`
    *   **Description**: 현재 로그인된 사용자 정보 조회

## 3. Scenarios API (시나리오)
CPX 실습 시나리오 목록 조회 및 선택 기능을 제공합니다.

*   `GET /scenarios`
    *   **Description**: 시나리오 목록 조회 (필터링: 과목, 난이도 등)
    *   **Query**: `?department=소화기내과&difficulty=EASY`
*   `GET /scenarios/{scenario_id}`
    *   **Description**: 특정 시나리오의 사전 브리핑 정보(환자 기본 정보, 주소, 목표) 조회. 
    *   *(주의: 환자의 비밀 과거력/가족력 등은 프론트엔드에 노출되지 않으며 백엔드 LLM 프롬프트에만 주입됨)*

## 4. Sessions API (실습 세션)
진료 연습 시작, 종료 및 대화 제어를 담당합니다.

*   `POST /sessions`
    *   **Description**: 새로운 연습 세션 시작
    *   **Body**: `{ "scenario_id": "uuid", "mode": "LEARNING" | "ACTIVE" | "EXAM" }`
    *   **Response**: `{ "session_id": "uuid", "welcome_message": "어디가 아파서 오셨나요?" }`
*   `POST /sessions/{session_id}/chat`
    *   **Description**: 의대생의 발화 텍스트(STT 변환 결과) 전송 및 AI 환자의 응답 요청
    *   **Body**: `{ "text": "가족 중에 비슷한 증상을 앓은 분이 있나요?" }`
    *   **Response**: `{ "reply": "아버지가 고혈압이 있으십니다.", "audio_url": "https://...", "tutor_guide": "null or string (LEARNING 모드 시에만 제공)" }`
*   `PUT /sessions/{session_id}/end`
    *   **Description**: 세션 강제 종료 또는 정상 완료 처리

## 5. Feedback API (평가 및 결과)
세션 종료 후 채점 결과 및 피드백을 제공합니다.

*   `GET /feedback/{session_id}`
    *   **Description**: 특정 세션의 채점 결과 및 피드백 조회
    *   **Response**: 병력청취/의사소통/환자교육 점수, 강점, Explainable Feedback (왜 이 질문이 필요했는지 설명하는 튜터링), 임상 사고과정 시각화(Clinical Reasoning Flow) 데이터
*   `GET /dashboard/stats`
    *   **Description**: 사용자의 누적 점수 추이 및 통계 데이터 제공

## 6. Admin API (관리자 전용)
관리자 전용 데이터 관리 엔드포인트입니다. (Admin 권한 필수)

*   `POST /admin/scenarios` : 시나리오 신규 등록
*   `POST /admin/rubrics` : 채점 루브릭 생성 및 버전 관리
