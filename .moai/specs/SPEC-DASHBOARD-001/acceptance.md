# SPEC-DASHBOARD-001: 인수 기준 (Acceptance Criteria)

## 메타데이터

| 항목 | 내용 |
|------|------|
| SPEC ID | SPEC-DASHBOARD-001 |
| 제목 | User Dashboard - Acceptance Criteria |
| 관련 SPEC | SPEC-AUTH-001, SPEC-ADMIN-001, SPEC-FLOW-001 |

---

## 테스트 시나리오

### TS-DASH-001: 사용자 대시보드 페이지 접근

**Given** 사용자가 이메일/비밀번호로 로그인한 상태이다
**And** 사용자가 이전에 명함 제작 요청을 2건 제출했다
**When** 사용자가 `/dashboard` 페이지에 접근한다
**Then** 시스템은 해당 사용자의 요청 2건을 최신순으로 표시한다
**And** 각 요청 항목에 Display Name, 상태 배지, 제출일시가 표시된다

---

### TS-DASH-002: 미인증 사용자 리다이렉트

**Given** 사용자가 로그인하지 않은 상태이다
**When** 사용자가 `/dashboard` URL에 직접 접근한다
**Then** 시스템은 `/login?callbackUrl=%2Fdashboard`로 리다이렉트한다
**And** 로그인 성공 후 `/dashboard`로 돌아온다

---

### TS-DASH-003: 빈 대시보드 표시

**Given** 사용자가 로그인한 상태이다
**And** 사용자가 제출한 명함 제작 요청이 없다
**When** 사용자가 `/dashboard` 페이지에 접근한다
**Then** 시스템은 "아직 제작 요청이 없습니다" 안내 메시지를 표시한다
**And** "명함 만들기" 버튼이 표시되어 `/create`로 이동할 수 있다

---

### TS-DASH-004: 사용자 요청 조회 API (GET /api/requests/my)

**Given** 사용자 A가 로그인한 상태이다 (이메일: user-a@example.com)
**And** 데이터베이스에 user-a@example.com이 생성한 요청 3건과 다른 사용자의 요청 5건이 존재한다
**When** 사용자 A가 `GET /api/requests/my`를 호출한다
**Then** 시스템은 사용자 A의 요청 3건만 반환한다 (`total: 3`)
**And** 응답에 다른 사용자의 요청은 포함되지 않는다
**And** 요청은 `submittedAt` 기준 내림차순으로 정렬된다

---

### TS-DASH-005: 미인증 사용자 API 접근 거부

**Given** 사용자가 로그인하지 않은 상태이다
**When** `GET /api/requests/my`를 호출한다
**Then** 시스템은 401 Unauthorized 응답을 반환한다
**And** 응답 본문에 `{ "error": "인증이 필요합니다. 로그인해 주세요." }` 메시지가 포함된다

---

### TS-DASH-006: 진행 상태 시각화 - submitted 상태

**Given** 사용자의 요청이 `submitted` (의뢰됨) 상태이다
**When** 대시보드에서 해당 요청을 확인한다
**Then** ProgressStepper에서 "의뢰됨" 단계가 파란색으로 강조 표시된다
**And** "작업중" 및 "확정" 단계는 회색으로 비활성화 표시된다

---

### TS-DASH-007: 진행 상태 시각화 - processing 상태

**Given** 사용자의 요청이 `processing` (작업중) 상태이다
**When** 대시보드에서 해당 요청을 확인한다
**Then** ProgressStepper에서 "의뢰됨" 단계에 체크 아이콘이 표시된다
**And** "작업중" 단계가 황색으로 강조 표시된다
**And** "확정" 단계는 회색으로 비활성화 표시된다

---

### TS-DASH-008: 진행 상태 시각화 - confirmed 상태

**Given** 사용자의 요청이 `confirmed` (확정) 상태이다
**When** 대시보드에서 해당 요청을 확인한다
**Then** ProgressStepper에서 "의뢰됨"과 "작업중" 단계에 체크 아이콘이 표시된다
**And** "확정" 단계가 녹색으로 강조 표시된다

---

### TS-DASH-009: 요청 상세 보기

**Given** 사용자가 로그인한 상태이다
**And** 사용자의 명함 제작 요청이 `processing` 상태이고 상태 이력이 2건 (submitted, processing) 존재한다
**When** 사용자가 대시보드에서 해당 요청을 클릭한다
**Then** `/dashboard/[id]` 페이지로 이동한다
**And** 상태 이력 타임라인이 2건의 이력과 함께 표시된다
**And** 명함 앞면 정보(Display Name)가 읽기 전용으로 표시된다
**And** 명함 뒷면 정보(Full Name, Title, Hashtags, Social Links)가 읽기 전용으로 표시된다

---

### TS-DASH-010: 요청 상세 - 일러스트 비교 표시

**Given** 사용자의 요청이 `confirmed` 상태이다
**And** 관리자가 일러스트 이미지를 업로드했다
**When** 사용자가 해당 요청 상세를 조회한다
**Then** CardCompare 컴포넌트가 원본 아바타와 일러스트 이미지를 나란히 비교 표시한다

---

### TS-DASH-011: 요청 상세 - 일러스트 없는 경우

**Given** 사용자의 요청이 `submitted` 상태이다
**And** 일러스트 이미지가 아직 업로드되지 않았다
**When** 사용자가 해당 요청 상세를 조회한다
**Then** CardCompare 영역 대신 "일러스트 제작 대기 중" 안내 메시지가 표시된다

---

### TS-DASH-012: 다른 사용자 요청 접근 차단

**Given** 사용자 A가 로그인한 상태이다 (이메일: user-a@example.com)
**And** 사용자 B가 생성한 요청 ID가 "request-b-uuid"이다
**When** 사용자 A가 `/dashboard/request-b-uuid`에 접근한다
**Then** 시스템은 403 Forbidden 응답을 반환한다
**And** 사용자는 대시보드(`/dashboard`)로 리다이렉트된다

---

### TS-DASH-013: 관리자의 사용자 대시보드 접근

**Given** 관리자가 로그인한 상태이다 (ADMIN_EMAILS에 포함)
**When** 관리자가 `/dashboard`에 접근한다
**Then** 관리자 본인이 제출한 요청 목록이 표시된다 (관리자도 일반 사용자로서 사용 가능)

---

### TS-DASH-014: UserMenu에 "내 요청" 메뉴 표시

**Given** 사용자가 로그인한 상태이다
**When** 사용자가 UserMenu를 열거나 확인한다
**Then** "내 요청" 메뉴 항목이 표시된다
**And** 클릭 시 `/dashboard`로 이동한다

---

### TS-DASH-015: 반응형 레이아웃 - 모바일

**Given** 사용자가 모바일 디바이스(화면 너비 < 768px)에서 접근한다
**And** 사용자에게 제출한 요청이 3건 있다
**When** 사용자가 `/dashboard`를 조회한다
**Then** 요청 목록이 카드형 레이아웃으로 표시된다
**And** 각 카드의 터치 영역이 최소 44px이다

---

### TS-DASH-016: 반응형 레이아웃 - 데스크톱

**Given** 사용자가 데스크톱(화면 너비 >= 768px)에서 접근한다
**And** 사용자에게 제출한 요청이 3건 있다
**When** 사용자가 `/dashboard`를 조회한다
**Then** 요청 목록이 테이블형 레이아웃으로 표시된다
**And** 테이블 헤더에 ID, Display Name, 상태, 제출일, 진행도 컬럼이 있다

---

### TS-DASH-017: 키보드 접근성

**Given** 사용자가 키보드만으로 네비게이션한다
**When** Tab 키로 요청 목록의 항목에 포커스를 이동한다
**Then** 포커스된 항목에 시각적 포커스 인디케이터가 표시된다
**And** Enter 키를 눌러 해당 요청 상세 페이지로 이동할 수 있다

---

### TS-DASH-018: 대시보드 페이지 로딩 상태

**Given** 사용자가 `/dashboard`에 접근한다
**And** API 응답이 지연되고 있다
**When** 페이지가 로딩 중이다
**Then** 스켈레톤 UI 또는 로딩 스피너가 표시된다
**And** 로딩 완료 후 요청 목록으로 전환된다

---

### TS-DASH-019: API 오류 처리

**Given** 사용자가 `/dashboard`에 접근한다
**And** `GET /api/requests/my` 호출이 500 오류를 반환한다
**When** 에러 응답을 수신한다
**Then** "요청 목록을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요." 에러 메시지가 표시된다
**And** "다시 시도" 버튼이 제공된다

---

## 품질 게이트 기준

### Definition of Done

| 기준 | 조건 |
|------|------|
| 기능 완성 | 모든 REQ-DASH-001 ~ REQ-DASH-008 요구사항 구현 |
| API 테스트 | GET /api/requests/my 인증, 필터링, 정렬 검증 |
| 소유권 검증 | GET /api/requests/[id]에서 일반 사용자 소유권 검증 통과 |
| 반응형 레이아웃 | 모바일(375px), 태블릿(768px), 데스크톱(1280px) 확인 |
| 접근성 | ARIA 속성 적용, 키보드 네비게이션 작동 |
| 에러 처리 | 로딩/에러/빈 상태 모두 적절한 UI 표시 |
| TypeScript | 타입 에러 0건 (`npx tsc --noEmit` 통과) |
| Lint | ESLint 에러 0건 (`npm run lint` 통과) |
| 기존 테스트 | 기존 테스트 스위트가 깨지지 않음 (`npm test` 통과) |

### 검증 방법

| 검증 항목 | 방법 | 도구 |
|-----------|------|------|
| API 인증/인가 | 수동 테스트 + 단위 테스트 | Vitest, fetch |
| 소유권 검증 | 다른 사용자 요청 접근 시도 | 수동 테스트 |
| 반응형 디자인 | Chrome DevTools 디바이스 에뮬레이션 | Chrome DevTools |
| 접근성 | Lighthouse Accessibility audit | Lighthouse |
| 상태 시각화 | 각 상태별 ProgressStepper 렌더링 확인 | 수동 + 시각 테스트 |
| 네비게이션 | UserMenu "내 요청" 메뉴 클릭 테스트 | 수동 테스트 |
| 라우트 보호 | 미인증 접근 시 리다이렉트 확인 | 수동 테스트 |
