# 2026-06-29 Practice Completion Reporting Fix

## 배경

테스트 중 약 8분간 연습 후 `종료`를 눌렀을 때 채점 화면으로 넘어가지 않고 세션이 닫히는 문제가 보고되었다.
해당 사용자의 `성과 리포트`에도 새 기록이 남지 않았다.

이 동작은 정상 동작이 아니며, 종료-채점-성과 저장 플로우의 결함이었다.

## 확인된 원인

1. 종료 시 프론트엔드가 존재하지 않는 채점 API 경로를 호출하던 흐름이 있었다.
   - 실패 로그: `POST /api/v1/feedback/evaluate HTTP/1.1" 405 Method Not Allowed`
   - 실제 사용 가능한 익명 채점 엔드포인트: `/api/v1/feedback/evaluate_anonymous`

2. 채점 실패 후 빈 결과로 종료 처리될 수 있어 사용자는 대시보드로 빠진 것처럼 보였다.
   - 결과 기록이 생성되지 않으므로 `성과 리포트`에도 표시되지 않았다.

3. 채점 결과가 메모리 상태에만 의존해 새로고침이나 예외 흐름에서 유실될 수 있었다.

4. Supabase 세션 insert가 실패해도 조용히 local test session으로 fallback 되었다.
   - 앱은 계속 작동하지만 DB 기반 사용자별 세션 누적은 남지 않을 수 있다.
   - 주요 원인은 현재 앱의 문자열 시나리오 ID(`scen-fever-5`)와 예전 UUID 기반 스키마를 혼동하거나 RLS insert 정책이 부족한 경우다.

5. 신체진찰 직후 바로 종료할 경우 React state 반영 타이밍보다 채점 요청이 먼저 나가면 PE 로그가 누락될 여지가 있었다.

## 수정 사항

### 종료 및 채점 플로우

- 종료 시 `/api/v1/feedback/evaluate_anonymous`를 호출하도록 정리했다.
- 채점 결과를 받은 경우에만 `성과 리포트`로 이동하도록 했다.
- 채점 실패 시 세션을 닫지 않고 현재 화면에 남겨 재시도할 수 있게 했다.
- 채점 중에는 종료, 초기화, 입력, 신체진찰 버튼을 비활성화해 중복 요청과 흐름 꼬임을 방지했다.

### 기록 보존

- 대화 메시지를 `messagesRef`에 즉시 반영하도록 수정했다.
- 신체진찰 로그를 `peLogRef`에 즉시 반영하도록 수정했다.
- 타이머 값을 `timerRef`로 참조해 종료 직전의 실제 진행 시간을 기록하도록 했다.
- `성과 리포트` 기록을 `localStorage`에도 저장해 새로고침 후에도 최근 결과가 유지되도록 했다.

### Supabase 스키마/RLS

- `supabase/schema.sql`의 `sessions` RLS 정책에 `WITH CHECK (auth.uid() = user_id)`를 추가했다.
- 로그인 사용자의 세션 insert가 RLS 때문에 실패하는 상황을 줄였다.
- `backend/schema.sql`은 예전 UUID 기반 설계 참고용임을 명시했다.
- README에 현재 앱 배포 시 `supabase/schema.sql`을 사용해야 한다고 기록했다.

## 검증 결과

로컬 브라우저에서 실제 사용자 플로우를 확인했다.

1. 로그인 상태에서 대시보드 진입
2. 정수아 케이스 상세 모달 열기
3. 정수아 연습실 진입
4. 타이머 `12:00` 확인
5. 세션 시작 및 WebSocket 연결 확인
6. 의사 질문 입력 후 AI 표준환자 응답 확인
7. 신체진찰 모달 진입
8. 체위 변경 시 `-2s` 즉시 반영 확인
9. CVAT 수행 시 `-10s` 즉시 반영 확인
10. 정수아 CVAT 소견이 `우측 늑골척추각(CVA) 타진 압통 양성(+)`으로 기록되는 것 확인
11. 진찰 종료 후 대화 기록에 신체진찰 수행 소견이 바로 추가되는 것 확인
12. 종료 클릭 후 채점 로딩 오버레이 표시 확인
13. 채점 완료 후 `성과 리포트`로 정상 이동 확인
14. 결과 리포트에 정수아 기록, 점수, Yes 항목 수, Strengths/Weaknesses 표시 확인
15. CVAT 수행이 Strengths에 반영되는 것 확인
16. 새로고침 후에도 최근 성과 리포트가 유지되는 것 확인

## Supabase 적용 후 확인할 것

사용자가 `supabase/schema.sql`을 Supabase SQL Editor에서 실행했다면 다음 테스트에서 확인해야 한다.

1. 브라우저 콘솔에 아래 경고가 더 이상 뜨지 않는지 확인한다.

```text
DB Session insert failed, falling back to local session
```

2. 경고가 사라지면 로그인 사용자의 `sessions` 테이블 insert가 정상화된 것이다.

3. 경고가 계속 뜨면 다음을 다시 확인한다.
   - Cloudtype 환경변수 `VITE_SUPABASE_URL`
   - Cloudtype 환경변수 `VITE_SUPABASE_ANON_KEY`
   - Cloudtype 환경변수 `SUPABASE_URL`
   - Cloudtype 환경변수 `SUPABASE_KEY`
   - Supabase SQL Editor에 적용한 파일이 `supabase/schema.sql`인지 여부
   - `backend/schema.sql`을 잘못 적용하지 않았는지 여부

## 관련 커밋

- `6009a10 fix: show evaluation result after logged-in practice`
- `11045fd fix: harden practice completion reporting`
- `84675d4 Merge remote-tracking branch 'origin/master'`

## 결론

8분 연습 후 채점으로 넘어가지 않고 성과 리포트가 비어 있던 것은 정상 동작이 아니었다.
현재는 프론트엔드 기준으로 종료 후 채점과 성과 리포트 생성이 정상 동작하도록 수정했고, 신체진찰 기록과 진행 시간도 즉시 반영되도록 보강했다.
Supabase 스키마 적용 후에는 DB 세션 저장 fallback 경고가 사라지는지 추가 확인하면 된다.
