---
id: SPEC-FLOW-001
document: acceptance
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-FLOW-001 Acceptance Criteria

## 수락 기준 (Acceptance Criteria)

### AC-001: 랜딩 페이지 표시 및 CTA 동작

**Given** 사용자가 애플리케이션 루트 URL(`/`)에 접속한 상태일 때
**When** 페이지가 로드되면
**Then** 서비스 소개 문구, 명함 샘플 미리보기, "명함 만들기" CTA 버튼이 표시되어야 한다

**Given** 사용자가 랜딩 페이지에 있을 때
**When** "명함 만들기" CTA 버튼을 클릭하면
**Then** `/create` 경로로 이동하고 위저드 Step 1이 표시되어야 한다

### AC-002: Progress Indicator 표시

**Given** 사용자가 위저드(`/create`)에 있을 때
**When** 위저드가 렌더링되면
**Then** 5단계 Progress Indicator가 상단에 표시되고, 현재 단계가 시각적으로 강조되어야 한다

**Given** 사용자가 Step 2에 있을 때
**When** Progress Indicator를 확인하면
**Then** Step 1은 완료(체크 아이콘), Step 2는 현재(강조 색상), Step 3-5는 미완료(비활성)로 표시되어야 한다

### AC-003: 실시간 미니 미리보기

**Given** 사용자가 위저드의 Step 1-3 중 아무 단계에 있을 때
**When** 텍스트 필드에 값을 입력하거나 이미지를 업로드하면
**Then** 미니 미리보기(MiniPreview)에 해당 변경 사항이 100ms 이내에 실시간으로 반영되어야 한다

### AC-004: Step 1 - 개인 정보 입력

**Given** 사용자가 Step 1(개인 정보)에 있을 때
**When** 단계가 표시되면
**Then** Display Name(필수), Full Name(선택), Title/Role(선택) 입력 필드가 표시되어야 한다

**Given** 사용자가 Step 1에서 Display Name을 입력한 상태일 때
**When** "다음" 버튼을 클릭하면
**Then** 입력값이 Zustand 스토어에 저장되고 Step 2로 전환되어야 한다

### AC-005: Step 2 - 사진 업로드 및 배경색 선택

**Given** 사용자가 Step 2(사진 업로드)에 있을 때
**When** 이미지 파일을 Drag & Drop 또는 파일 선택으로 업로드하면
**Then** 이미지가 Base64로 변환되어 스토어에 저장되고, 미니 미리보기에 반영되어야 한다

**Given** 사용자가 Step 2에서 배경색 선택기를 사용할 때
**When** 새로운 색상을 선택하면
**Then** 앞면 또는 뒷면의 배경색이 스토어에 저장되고, 미니 미리보기에 즉시 반영되어야 한다

### AC-006: Step 3 - 소셜 링크 및 해시태그

**Given** 사용자가 Step 3(소셜/태그)에 있을 때
**When** Hashtag 입력 필드에 텍스트를 입력하고 Enter 키를 누르면
**Then** 새 해시태그가 목록에 추가되고 스토어에 저장되어야 한다

**Given** 사용자가 Step 3에서 소셜 링크를 추가할 때
**When** 플랫폼을 선택하고 URL을 입력하여 추가하면
**Then** 새 소셜 링크가 목록에 표시되고 스토어에 저장되어야 한다

### AC-007: Step 4 - 미리보기 및 상세 편집 연결

**Given** 사용자가 Step 4(미리보기)에 있을 때
**When** 미리보기 단계가 표시되면
**Then** 명함 앞면과 뒷면의 전체 크기 미리보기가 표시되어야 한다

**Given** 사용자가 Step 4에서 "상세 편집" 버튼을 클릭할 때
**When** 버튼을 클릭하면
**Then** `/create/edit` 경로로 이동하여 SPEC-UI-001의 전체 편집기 인터페이스가 표시되어야 한다

### AC-008: Step 5 - 완료 및 내보내기

**Given** 사용자가 Step 5(완료)에 있을 때
**When** "PNG 내보내기" 버튼을 클릭하면
**Then** 명함 앞면과 뒷면이 각각 PNG 파일로 다운로드되어야 한다

**Given** 사용자가 Step 5에서 "새 명함 만들기" 버튼을 클릭할 때
**When** 버튼을 클릭하면
**Then** 카드 데이터가 기본값으로 초기화되고, 위저드가 Step 1부터 다시 시작되어야 한다

### AC-009: 위저드 상태 영속성 (localStorage)

**Given** 사용자가 위저드 Step 3에서 데이터를 입력한 상태일 때
**When** 브라우저를 닫고 다시 열어 `/create`에 접속하면
**Then** 위저드가 Step 3에서 복원되고, 이전에 입력한 모든 데이터가 유지되어야 한다

### AC-010: 위저드 네비게이션 (이전/다음/직접 이동)

**Given** 사용자가 Step 3에 있을 때
**When** "이전" 버튼을 클릭하면
**Then** Step 2로 돌아가고, Step 2에서 입력한 데이터가 그대로 유지되어야 한다

**Given** 사용자가 Step 3에 있을 때
**When** Progress Indicator에서 Step 1(완료된 단계)을 클릭하면
**Then** Step 1으로 직접 이동하고, Step 1의 입력 데이터가 유지되어야 한다

---

## Edge Case 시나리오

### EC-001: 필수 필드 유효성 검사

**Given** 사용자가 Step 1에서 Display Name 필드를 비워둔 상태일 때
**When** "다음" 버튼을 클릭하면
**Then** 다음 단계로 이동하지 않고, Display Name 필드에 "필수 입력 항목입니다" 오류 메시지가 표시되어야 한다

**Given** 사용자가 Display Name에 공백만 입력한 상태일 때
**When** "다음" 버튼을 클릭하면
**Then** 공백은 유효한 입력으로 인정하지 않고, 오류 메시지를 표시해야 한다

### EC-002: 기존 localStorage 데이터 호환

**Given** SPEC-UI-001에서 생성된 기존 `namecard-storage` 데이터가 localStorage에 있을 때
**When** 사용자가 `/create` 위저드에 처음 접속하면
**Then** 기존 카드 데이터는 유지되고, `wizardStep`은 기본값(1)으로 초기화되어 정상 작동해야 한다

### EC-003: 대용량 이미지 처리

**Given** 사용자가 Step 2에서 5MB를 초과하는 이미지를 업로드할 때
**When** 파일 선택 또는 Drag & Drop으로 업로드를 시도하면
**Then** 시스템은 이미지를 거부하고 "파일 크기는 5MB 이하여야 합니다" 오류 메시지를 표시해야 한다

### EC-004: 브라우저 뒤로가기 동작

**Given** 사용자가 위저드 Step 3에서 데이터를 입력한 상태일 때
**When** 브라우저의 뒤로가기 버튼을 클릭하면
**Then** 현재까지 입력된 데이터가 localStorage에 자동 저장되어, 다시 `/create`에 접속하면 데이터가 복원되어야 한다

---

## Performance Criteria

| 항목                           | 기준                  | 검증 방법                        |
| ------------------------------ | --------------------- | -------------------------------- |
| 랜딩 페이지 LCP               | 1.5초 이내            | Lighthouse Performance Audit     |
| 위저드 Step 전환 시간          | 300ms 이내            | 수동 측정 / Performance API      |
| 미니 미리보기 반영 지연        | 100ms 이내            | 수동 측정 / React Profiler       |
| localStorage 상태 복원 시간    | 500ms 이내            | 수동 측정                        |
| 번들 크기 (gzip, 위저드 포함)  | 250KB 이내            | `next build` 결과 확인           |

---

## Accessibility Criteria

| 항목                           | 기준                                           | 검증 방법               |
| ------------------------------ | ---------------------------------------------- | ----------------------- |
| 키보드 네비게이션              | Tab, Enter, Space로 위저드 전체 탐색 가능      | 수동 키보드 테스트      |
| ARIA 속성                      | ProgressBar: `aria-current="step"` 적용        | 코드 리뷰 / axe 검사   |
| Focus 관리                     | Step 전환 시 새 단계 첫 입력 필드에 자동 포커스| 수동 테스트             |
| 터치 타겟 크기                 | 모든 버튼 최소 44px x 44px                     | Chrome DevTools 측정    |
| 색상 대비                      | WCAG AA 기준 4.5:1 이상                        | axe / Lighthouse        |
| 반응형 레이아웃                | 320px ~ 1920px 뷰포트에서 정상 표시            | 브라우저 리사이즈 테스트|
| 스크린 리더 호환               | 단계 정보 및 입력 필드 라벨 읽기 가능          | VoiceOver / NVDA 테스트 |

---

## Quality Gate (Definition of Done)

- [ ] 모든 Acceptance Criteria(AC-001 ~ AC-010)가 통과
- [ ] 모든 Edge Case(EC-001 ~ EC-004)가 처리됨
- [ ] Performance Criteria 전체 충족
- [ ] Accessibility Criteria 전체 충족
- [ ] SPEC-UI-001 기존 기능에 대한 regression 없음
- [ ] TypeScript strict mode 에러 0건
- [ ] ESLint 에러 0건
- [ ] Vitest 단위 테스트 추가 및 통과 (위저드 스토어 로직)
- [ ] 반응형 레이아웃 검증 (모바일 320px, 태블릿 768px, 데스크톱 1280px)
- [ ] 기존 `namecard-storage` localStorage 데이터와의 하위 호환성 확인

---

## Traceability

| 수락 기준  | 관련 요구사항            | 검증 유형       |
| ---------- | ------------------------ | --------------- |
| AC-001     | REQ-E-001                | 기능 테스트     |
| AC-002     | REQ-U-001                | UI 테스트       |
| AC-003     | REQ-U-002                | 성능 테스트     |
| AC-004     | REQ-S-001, REQ-E-002     | 기능 테스트     |
| AC-005     | REQ-S-002                | 기능 테스트     |
| AC-006     | REQ-S-003                | 기능 테스트     |
| AC-007     | REQ-S-004, REQ-E-003     | 기능/라우팅 테스트 |
| AC-008     | REQ-E-004                | 기능 테스트     |
| AC-009     | REQ-U-003                | 영속성 테스트   |
| AC-010     | REQ-E-002, REQ-E-005     | 네비게이션 테스트 |
| EC-001     | REQ-N-001                | 유효성 검사     |
| EC-002     | REQ-U-003                | 호환성 테스트   |
| EC-003     | SPEC-UI-001 REQ-N-002    | 유효성 검사     |
| EC-004     | REQ-N-002                | 데이터 보존     |
