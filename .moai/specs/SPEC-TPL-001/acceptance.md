---
id: SPEC-TPL-001
type: acceptance
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-TPL-001: 인수 기준 - 명함 디자인 템플릿 시스템

## 인수 기준 (Acceptance Criteria)

### AC-001: 기본 제공 템플릿 존재 확인 (REQ-U-001)

**Given** 사용자가 명함 편집기 페이지에 접속한 상태에서
**When** 템플릿 갤러리 섹션을 확인하면
**Then** 최소 6개의 기본 제공 템플릿(Classic Red, Ocean Blue, Forest Green, Sunset Orange, Midnight Dark, Clean White)이 표시된다

**검증 방법**:
- `DEFAULT_TEMPLATES` 배열의 길이가 6 이상인지 확인
- 각 템플릿의 `id`, `name`, `nameKo`, `category`, 색상 값이 모두 유효한지 확인
- 갤러리 UI에 모든 템플릿이 렌더링되는지 확인

---

### AC-002: 템플릿 앞면/뒷면 미리보기 (REQ-U-002)

**Given** 템플릿 갤러리가 표시된 상태에서
**When** 각 템플릿 카드를 확인하면
**Then** 앞면 배경색과 뒷면 배경색이 시각적으로 구분되어 미리보기로 표시된다

**검증 방법**:
- TemplateCard 컴포넌트가 `frontBackgroundColor`와 `backBackgroundColor`를 각각 렌더링하는지 확인
- 앞면/뒷면 영역이 시각적으로 구분 가능한지 확인
- 텍스트 색상(`textColor`)이 프리뷰에 반영되는지 확인

---

### AC-003: 템플릿 선택 시 스타일 적용 (REQ-E-001)

**Given** 사용자가 명함 편집기에서 기본 템플릿(Classic Red)을 사용하고 있는 상태에서
**When** "Ocean Blue" 템플릿을 클릭하면
**Then** 명함 앞면 배경색이 `#2B6CB0`으로, 뒷면 배경색이 `#1A365D`로 즉시 변경된다
**And** 미리보기 카드에 변경된 배경색이 실시간으로 반영된다

**검증 방법**:
- `useCardStore`의 `card.front.backgroundColor` 값이 `#2B6CB0`인지 확인
- `useCardStore`의 `card.back.backgroundColor` 값이 `#1A365D`인지 확인
- `selectedTemplateId` 값이 `ocean-blue`인지 확인
- CardFront/CardBack 컴포넌트의 배경색이 업데이트되는지 확인

---

### AC-004: 빈 명함으로 시작 (REQ-E-002)

**Given** 사용자가 템플릿 갤러리를 확인하고 있는 상태에서
**When** "빈 명함으로 시작" 옵션을 선택하면
**Then** 앞면 배경색이 `#FFFFFF`, 뒷면 배경색이 `#F7FAFC`로 설정된다
**And** 모든 텍스트 필드가 기본 플레이스홀더 값으로 표시된다

**검증 방법**:
- 빈 명함 옵션 클릭 시 Store 상태가 흰색 계열로 초기화되는지 확인
- `selectedTemplateId`가 `null` 또는 빈 명함 식별자로 설정되는지 확인

---

### AC-005: 사용자 색상 수정 유지 (REQ-E-003)

**Given** 사용자가 "Ocean Blue" 템플릿을 적용한 상태에서
**When** 색상 선택기(ColorPicker)로 앞면 배경색을 `#3182CE`로 직접 변경하면
**Then** 앞면 배경색이 `#3182CE`로 업데이트된다
**And** 변경된 색상이 localStorage에 저장된다
**And** 뒷면 배경색은 템플릿 기본값(`#1A365D`)을 유지한다

**검증 방법**:
- `updateFront({ backgroundColor: '#3182CE' })` 호출 후 Store 상태 확인
- localStorage에 변경된 값이 persist 되는지 확인
- 뒷면 배경색이 변경되지 않았는지 확인

---

### AC-006: 템플릿 전환 시 콘텐츠 보존 (REQ-S-001)

**Given** 사용자가 다음 콘텐츠를 입력한 상태에서:
  - Display Name: "John Doe"
  - Full Name: "John Michael Doe"
  - Title: "Software Engineer"
  - Hashtags: ["#Developer", "#React"]
  - Avatar Image: (업로드된 이미지 존재)
  - Social Links: [{ platform: "linkedin", url: "https://linkedin.com/in/johndoe", label: "LinkedIn" }]
**When** "Forest Green" 템플릿으로 전환하면
**Then** 배경색만 변경된다:
  - 앞면 배경: `#E53E3E` -> `#276749`
  - 뒷면 배경: `#9B2C2C` -> `#1C4532`
**And** 다음 콘텐츠는 모두 보존된다:
  - Display Name: "John Doe"
  - Full Name: "John Michael Doe"
  - Title: "Software Engineer"
  - Hashtags: ["#Developer", "#React"]
  - Avatar Image: (업로드된 이미지 그대로 유지)
  - Social Links: (LinkedIn 링크 그대로 유지)

**검증 방법**:
- `applyTemplate` 호출 전후로 콘텐츠 필드 값 비교
- `displayName`, `fullName`, `title`, `hashtags`, `socialLinks`, `avatarImage` 필드가 동일한지 확인
- `backgroundColor` 필드만 변경되었는지 확인

---

### AC-007: 커스텀 템플릿 저장 - Optional (REQ-O-001)

**Given** 사용자가 색상을 직접 커스터마이징한 상태에서 (앞면: `#8B5CF6`, 뒷면: `#5B21B6`)
**When** "현재 색상을 템플릿으로 저장" 기능을 사용하면
**Then** 사용자 커스텀 템플릿이 localStorage에 저장된다
**And** 갤러리의 커스텀 템플릿 섹션에 저장된 템플릿이 표시된다

**검증 방법**:
- localStorage `namecard-custom-templates` 키에 데이터가 저장되는지 확인
- 갤러리에 커스텀 템플릿이 추가 표시되는지 확인

---

### AC-008: 카테고리 필터링 - Optional (REQ-O-002)

**Given** 템플릿 갤러리가 모든 템플릿을 표시하고 있는 상태에서
**When** "Business" 카테고리 필터를 선택하면
**Then** Classic Red, Ocean Blue 템플릿만 표시된다
**And** 다른 카테고리(Creative, Minimal) 템플릿은 숨겨진다

**검증 방법**:
- "Business" 필터 클릭 시 `category === 'business'`인 템플릿만 렌더링되는지 확인
- "전체" 필터 클릭 시 모든 템플릿이 다시 표시되는지 확인
- 필터 전환이 즉시 반영되는지 확인

---

## 엣지 케이스 (Edge Cases)

### EC-001: localStorage에 기존 데이터가 있는 상태에서 템플릿 시스템 최초 로드

**Given** 사용자가 SPEC-UI-001 기반 편집기에서 데이터를 저장한 상태에서 (`selectedTemplateId` 필드 없음)
**When** 템플릿 시스템이 포함된 새 버전으로 접속하면
**Then** 기존 데이터는 모두 보존된다
**And** `selectedTemplateId`는 `null`로 초기화된다
**And** 갤러리에서 어떤 템플릿도 "선택됨" 상태로 표시되지 않는다

**검증 방법**:
- Zustand persist `migrate` 함수가 정상 동작하는지 확인
- 기존 `CardData` 구조가 손상되지 않는지 확인

---

### EC-002: 빠른 연속 템플릿 전환

**Given** 사용자가 편집기에서 작업 중인 상태에서
**When** 여러 템플릿을 빠르게 연속으로 클릭하면 (Classic Red -> Ocean Blue -> Forest Green -> Midnight Dark)
**Then** 마지막으로 선택한 템플릿(Midnight Dark)의 색상이 최종 적용된다
**And** 콘텐츠 데이터에 어떠한 손실이나 중복도 발생하지 않는다
**And** UI가 깜빡이거나 버벅이지 않는다

**검증 방법**:
- 빠른 연속 클릭 후 최종 Store 상태가 Midnight Dark 값과 일치하는지 확인
- 콘텐츠 필드가 원본과 동일한지 확인

---

### EC-003: 리셋 후 템플릿 상태

**Given** 사용자가 "Ocean Blue" 템플릿을 적용하고 콘텐츠를 편집한 상태에서
**When** 리셋 버튼을 클릭하고 확인하면
**Then** 모든 데이터가 `DEFAULT_CARD` 값으로 복원된다
**And** `selectedTemplateId`가 초기값으로 리셋된다
**And** 갤러리에서 선택 상태가 초기화된다

**검증 방법**:
- `resetCard` 호출 후 모든 필드가 기본값과 일치하는지 확인
- `selectedTemplateId`가 기대값과 일치하는지 확인

---

## 시각 품질 기준 (Visual Quality Criteria)

### VQ-001: 갤러리 레이아웃

- 모바일 (< 768px): 2열 그리드, 갤러리 높이 제한 + 스크롤
- 태블릿 (768px ~ 1024px): 3열 그리드
- 데스크톱 (> 1024px): 3열 그리드, 에디터 패널 내 배치
- 각 TemplateCard 간 일정한 간격 (gap: 12px ~ 16px)

### VQ-002: TemplateCard 디자인

- 각 카드는 앞면/뒷면 색상 블록을 나란히 또는 상하로 표시
- 호버 시 부드러운 확대 효과 (`transition: transform 150ms ease`)
- 선택된 카드: 테두리 강조 (2px solid, 브랜드 색상), 체크마크 아이콘
- 카드 하단에 템플릿 한국어 이름 표시

### VQ-003: 색상 전환

- 템플릿 적용 시 배경색 변경이 부드러운 트랜지션으로 표현 (`transition-colors duration-300`)
- 갑작스러운 색상 변경이 아닌 자연스러운 페이드 효과

---

## 접근성 기준 (Accessibility Criteria)

### A11Y-001: 키보드 탐색

- Tab 키로 갤러리 진입
- Arrow 키(좌/우/상/하)로 템플릿 간 이동
- Enter 또는 Space 키로 템플릿 선택
- Escape 키로 갤러리 포커스 해제

### A11Y-002: 스크린 리더

- 갤러리 컨테이너: `role="radiogroup"`, `aria-label="명함 템플릿 선택"`
- 각 TemplateCard: `role="radio"`, `aria-checked`, `aria-label="{템플릿 이름}"`
- 템플릿 선택 시 상태 변경이 `aria-live` 영역으로 알림

### A11Y-003: 터치 접근성

- 각 TemplateCard의 최소 터치 영역: 44px x 44px
- `@media (pointer: coarse)` 쿼리로 터치 디바이스 최적화

---

## 완료 정의 (Definition of Done)

- [ ] 6개 기본 제공 템플릿 데이터 정의 완료
- [ ] TemplateGallery / TemplateCard 컴포넌트 구현 완료
- [ ] Zustand Store에 `applyTemplate` 액션 추가 완료
- [ ] 템플릿 적용 시 콘텐츠 보존 확인
- [ ] 편집기 페이지에 갤러리 통합 완료
- [ ] 반응형 레이아웃 (모바일/태블릿/데스크톱) 확인
- [ ] 키보드 탐색 및 스크린 리더 호환성 확인
- [ ] localStorage 마이그레이션 호환성 확인
- [ ] 기존 기능(편집, 내보내기, 리셋) 회귀 테스트 통과
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 에러 없음

---

## 트레이서빌리티

| 인수 기준 | 요구사항  | plan.md Phase |
| --------- | --------- | ------------- |
| AC-001    | REQ-U-001 | Phase 1       |
| AC-002    | REQ-U-002 | Phase 2       |
| AC-003    | REQ-E-001 | Phase 3, 4    |
| AC-004    | REQ-E-002 | Phase 2, 4    |
| AC-005    | REQ-E-003 | Phase 3       |
| AC-006    | REQ-S-001 | Phase 3       |
| AC-007    | REQ-O-001 | Phase 5       |
| AC-008    | REQ-O-002 | Phase 2       |
| EC-001    | REQ-S-001 | Phase 3       |
| EC-002    | REQ-E-001 | Phase 3       |
| EC-003    | REQ-E-001 | Phase 3       |
