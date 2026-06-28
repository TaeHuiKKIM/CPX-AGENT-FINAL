# Medi-CPX React Structured

기존 단일 `App.jsx` 중심 React 코드를 컴포넌트 단위로 분리한 버전입니다.

## 실행 방법

```bash
npm install
npm run dev
```

## 파일 구조

```txt
src/
├─ App.jsx                         # 전체 state, 탭 라우팅, 페이지 연결
├─ main.jsx                        # React 앱 진입점
├─ constants/
│  └─ navigation.js                 # 탭/사이드바 메뉴 상수
├─ data/
│  └─ initialData.js                # 시나리오, 알림, 히스토리, 루브릭 초기 데이터
├─ utils/
│  ├─ cloneData.js                  # 초기 데이터 deep copy 유틸
│  ├─ speech.js                     # TTS 출력 유틸
│  └─ time.js                       # 타이머 포맷 유틸
├─ components/
│  ├─ layout/
│  │  ├─ Sidebar.jsx                # 왼쪽 네비게이션
│  │  └─ Topbar.jsx                 # 상단바, 알림 드롭다운
│  └─ scenario/
│     └─ ScenarioDetailModal.jsx    # 시나리오 상세 모달
├─ pages/
│  ├─ Dashboard.jsx                 # 대시보드 카드, 공지, 캘린더
│  ├─ ScenarioLibrary.jsx           # 시나리오 검색/필터/정렬
│  ├─ PracticeRoom.jsx              # AI 표준환자 대화, STT/TTS, 타이머, 정서 게이지
│  ├─ HistoryPage.jsx               # 연습 이력, 상세 리포트, Chart.js 레이더 차트
│  ├─ RubricAdmin.jsx               # 루브릭 CRUD, 버전 로그, 검수 코멘트
│  └─ SettingsPage.jsx              # 프로필, 마이크 테스트, 데이터 삭제
└─ styles/
   └─ global.css                    # 전체 스타일
```

## 설계 기준

- `App.jsx`: 전역 상태와 페이지 라우팅만 담당합니다.
- `pages/`: 화면 하나를 구성하는 큰 단위 컴포넌트입니다.
- `components/`: 여러 페이지에서 재사용하거나 역할이 명확한 UI 컴포넌트입니다.
- `utils/`: 화면과 무관한 순수 함수 또는 브라우저 기능 래퍼입니다.
- `data/`: 목업 데이터를 별도 파일로 분리했습니다.
