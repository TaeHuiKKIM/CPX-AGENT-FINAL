# API 연동 명세서 — 발열 Yes/No 100점 채점 반영판

## 1. 개요 및 통신 아키텍처

본 문서는 프론트엔드와 백엔드 서비스 간 통신 규격을 정의한다. 일반 CRUD는 Supabase SDK로 처리하고, 실시간 AI 환자 대화 및 평가 엔진은 FastAPI가 처리한다. 평가 결과는 **발열 채점표 예시 기반 40개 Yes/No 항목, 가중치 없는 100점 방식**으로 반환한다.

## 공통 채점 기준 — 발열 채점표 Yes/No 100점

- 기준 문서: `CPX_발열_채점표_YesNo_100점.md`
- 총 항목 수: 40개
- 판정값: `Yes` 또는 `No`
- 가중치: 없음
- 부분점수: 없음
- 최종 점수: `Yes 개수 / 40 × 100`
- 항목당 환산 점수: 2.5점
- 기존 `잘함/보통/미흡`은 사용하지 않음

---

## 2. Supabase SDK 연동 범위 — 프론트엔드 직접 호출

아래 기능은 프론트엔드에서 Supabase Client로 직접 수행한다. RLS 정책으로 접근을 제한한다.

| 기능 | 대상 |
|---|---|
| 인증 | Supabase Auth 이메일 가입, 로그인, 로그아웃 |
| 시나리오 탐색 | `Scenarios` Select |
| 루브릭 조회 | 활성 `Rubrics` Select. 발열 루브릭 40항목 조회 |
| 대시보드 히스토리 | 본인의 `Sessions`, `Feedback_Results` Select |
| 결과 화면 | `Feedback_Results.score_items`, `missed_items`, `domain_summary` 조회 |
| 오디오 저장 | Supabase Storage `audio_records` 업로드/조회 |
| 어드민 관리 | `Organizations`, `Scenarios`, `Rubrics` Insert/Update |

---

## 3. FastAPI 공통 규칙

- Base URL: `https://[FASTAPI_DOMAIN]/api/v1`
- WebSocket Base URL: `wss://[FASTAPI_DOMAIN]/api/v1`
- Authorization: `Authorization: Bearer {SUPABASE_JWT}`
- 모든 평가 응답의 `scoring_mode`는 `fever_checklist_yes_no_100_no_weight`를 사용한다.

### 공통 에러 응답

```json
{
  "status": "error",
  "code": "RUBRIC_ITEM_COUNT_INVALID",
  "message": "발열 루브릭은 정확히 40개 항목이어야 합니다."
}
```

---

## 4. Sessions API — 실시간 실습 세션

### 4.1 `POST /sessions`
세션을 생성한다. 프론트엔드가 Supabase로 직접 생성해도 되지만, FastAPI에서 루브릭 검증까지 함께 처리하려면 이 엔드포인트를 사용한다.

#### Request
```json
{
  "scenario_id": "scen-fever-5",
  "mode": "LEARNING"
}
```

#### Response
```json
{
  "session_id": "uuid",
  "scenario_id": "scen-fever-5",
  "rubric_id": "uuid",
  "mode": "LEARNING",
  "status": "IN_PROGRESS",
  "scoring_mode": "fever_checklist_yes_no_100_no_weight",
  "total_items": 40
}
```

### 4.2 `WebSocket /sessions/{session_id}/stream`
브라우저에서 확정된 학생 발화 텍스트와 신체진찰 로그를 FastAPI에 전달하고, AI 환자 응답을 받는 양방향 통신이다. 브라우저 STT/TTS를 사용할 수 있지만, 서버 WebSocket은 현재 텍스트/JSON 이벤트 중심으로 동작한다.

#### Client → Server
- JSON: 학생 발화, 시나리오 컨텍스트, 신체진찰 결과 이벤트

```json
{
  "text": "언제부터 열이 났나요?"
}
```

```json
{
  "type": "scenario_context",
  "scenario": {
    "id": "scen-fever-3",
    "patientName": "김민수",
    "cc": "열이 나고 몸살처럼 아파요."
  }
}
```

```json
{
  "type": "pe_results",
  "log": {
    "usedTime": 17,
    "performed": { "c_lung": { "orderOk": null } }
  },
  "findings": [
    { "nm": "폐 청진", "find": "양폐 정상 호흡음, 수포음·천명음 없음" }
  ]
}
```

#### Server → Client
```json
{
  "event": "ai_reply",
  "text": "이틀 전부터 열이 났어요.",
  "tutor_guide": null
}
```

#### Background Activity
- 모든 `USER`, `AI`, `SYSTEM` 이벤트를 `Transcripts`에 저장한다.
- 채점에서 Yes 근거로 사용할 데이터는 원칙적으로 `USER`의 질문/진찰/교육 발화다.
- AI 환자가 먼저 말한 정보는 학생 수행으로 인정하지 않는다.

---

## 5. Feedback API — 세션 종료 및 평가 트리거

### 5.1 `POST /feedback/evaluate_anonymous`
현행 프론트엔드가 세션 종료 시 사용하는 동기 채점 API다.

#### Description
프론트엔드가 보유한 Transcript, 신체진찰 로그, 루브릭 맥락을 즉시 전송한다. FastAPI는 이를 40개 항목과 대조해 Yes/No 결과를 반환한다. LLM에는 Yes 항목 번호와 근거만 간결하게 요청하고, 서버가 40개 전체 결과를 복원한다.

#### Request
```json
{
  "scenario_id": "scen-fever-5",
  "transcripts": [
    { "speaker": "doctor", "text": "언제부터 열이 났나요?", "time": "오후 02:10" },
    { "speaker": "system", "text": "신체진찰 수행 소견:\n- 늑척추각 타진(CVAT): 우측 CVA 압통 양성(+)" }
  ],
  "rubric_data": {
    "scenario_goals": ["발열 시작 시점 확인"],
    "case_rubrics": []
  },
  "pe_log": {
    "usedTime": 12,
    "performed": ["cvat"],
    "findings": [
      { "nm": "늑척추각 타진(CVAT)", "find": "우측 CVA 압통 양성(+)" }
    ]
  }
}
```

#### Response
```json
{
  "score_total": 10.0,
  "yes_count": 4,
  "total_items": 40,
  "scoring_mode": "fever_checklist_yes_no_100_no_weight",
  "items": [],
  "missed_items": [],
  "strengths": [],
  "weaknesses": [],
  "explainable_feedback": []
}
```

프론트엔드는 응답을 즉시 성과 리포트로 변환한다. 채점 API가 실패하면 `evaluation_failed_recovery` 상태의 실패 리포트를 생성해 Transcript, PE 로그, 오류 원문을 보존한다.

### 5.2 `POST /feedback/{session_id}/evaluate`
DB에 저장된 세션을 백그라운드로 채점하기 위한 보조 API다.

#### Description
FastAPI가 해당 세션의 `Transcripts`와 신체진찰 로그를 읽어 40개 항목을 Yes/No로 판정한다. 현재 프론트엔드 실시간 결과 화면은 5.1의 동기 API를 우선 사용한다.

#### Immediate Response
```json
{
  "status": "processing_started",
  "message": "Evaluation is running in the background."
}
```

### 5.3 `GET /feedback/{session_id}`
평가 완료된 결과를 조회한다. Supabase SDK 조회로 대체 가능하지만, FastAPI를 통해 후처리된 결과를 받고 싶을 때 사용한다.

#### Response
```json
{
  "status": "completed",
  "session_id": "uuid",
  "result_id": "uuid",
  "scoring_mode": "fever_checklist_yes_no_100_no_weight",
  "score_total": 75.0,
  "yes_count": 30,
  "no_count": 10,
  "total_items": 40,
  "domain_summary": [
    {
      "domain": "병력 청취-주제 관련",
      "yes_count": 8,
      "total_items": 10,
      "note": "참고용 영역별 요약이며 최종 점수 가중치는 없음"
    }
  ],
  "items": [
    {
      "id": 1,
      "domain": "병력 청취-주제 관련",
      "criterion": "발열이 시작된 시기와 지속 기간을 질문하였다.",
      "result": "Yes",
      "evidence": "언제부터 열이 났나요? 계속 나나요?",
      "feedback": "발열 시작 시기와 지속 기간을 확인했습니다."
    },
    {
      "id": 9,
      "domain": "병력 청취-주제 관련",
      "criterion": "최근 여행력, 접촉력, 음식 복용을 질문하였다.",
      "result": "No",
      "evidence": null,
      "feedback": "발열에서는 말라리아, 장티푸스, 식중독 감별을 위해 여행력·접촉력·음식 복용 확인이 필요합니다."
    }
  ],
  "missed_items": [
    {
      "id": 9,
      "domain": "병력 청취-주제 관련",
      "criterion": "최근 여행력, 접촉력, 음식 복용을 질문하였다.",
      "why_it_matters": "감염성 발열 원인을 감별하기 위해 필요합니다.",
      "next_question_example": "최근 여행 다녀오셨거나, 아픈 사람과 접촉했거나, 평소와 다른 음식을 드신 적 있으세요?"
    }
  ],
  "summary": "총 40개 항목 중 30개를 수행했습니다. 여행력과 탈수 증상 확인이 부족했습니다."
}
```

---

## 6. Rubric API — 관리자용

### 6.1 `GET /rubrics/fever/active`
현재 활성화된 발열 Yes/No 루브릭을 조회한다.

#### Response
```json
{
  "rubric_id": "uuid",
  "symptom_tag": "발열",
  "version": 1,
  "scoring_mode": "fever_checklist_yes_no_100_no_weight",
  "total_items": 40,
  "uses_weight": false,
  "uses_partial_score": false,
  "items": [
    {
      "id": 1,
      "domain": "병력 청취-주제 관련",
      "criterion": "발열이 시작된 시기와 지속 기간을 질문하였다.",
      "result_type": "YES_NO"
    }
  ]
}
```

### 6.2 `POST /admin/rubrics/fever`
관리자가 발열 루브릭 새 버전을 등록한다.

#### 검증 규칙
- `items.length`는 반드시 40이어야 한다.
- 모든 항목의 `result_type`은 `YES_NO`이어야 한다.
- `weight`, `partial_score`, `level` 값이 있으면 저장하지 않는다.

---

## 7. 프론트엔드 결과 화면 매핑

| API 필드 | UI 표시 |
|---|---|
| `score_total` | 총점 카드 |
| `yes_count`, `no_count` | 수행/누락 개수 |
| `items[]` | 40개 Yes/No 체크리스트 테이블 |
| `items[].evidence` | 수행 근거 문장 |
| `missed_items[]` | 누락 항목 코칭 카드 |
| `domain_summary[]` | 영역별 참고 요약 |
| `summary` | 교수 총평형 한 문단 피드백 |

---

## 8. 채점 산식 고정

```text
score_total = (yes_count / 40) × 100
```

- 가중치 없음
- 부분점수 없음
- 잘함/보통/미흡 없음
- 케이스별 난이도 보정 없음
- 영역별 가중치 없음
