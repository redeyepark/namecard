---
id: SPEC-TPL-001
type: plan
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-TPL-001: 구현 계획 - 명함 디자인 템플릿 시스템

## 요약

명함 디자인 템플릿 시스템을 5단계로 구현합니다. 타입 정의와 정적 데이터부터 시작하여, 갤러리 UI 컴포넌트, Zustand Store 확장, 편집기 통합, 최종 폴리시 순서로 진행합니다.

---

## Phase 1: 템플릿 타입 정의 및 데이터 (Primary Goal)

**목표**: 템플릿 시스템의 기반 타입과 정적 데이터를 정의합니다.

**관련 요구사항**: REQ-U-001

### 작업 항목

1. **`src/types/template.ts` 생성**
   - `TemplateCategory` 타입 정의: `'business' | 'creative' | 'minimal'`
   - `CardTemplate` 인터페이스 정의: `id`, `name`, `nameKo`, `category`, `frontBackgroundColor`, `backBackgroundColor`, `textColor`, `accentColor`, `preview?`

2. **`src/data/templates.ts` 생성**
   - `DEFAULT_TEMPLATES: CardTemplate[]` 배열 정의
   - 6개 기본 템플릿 데이터 입력:
     - `classic-red`: frontBg `#E53E3E`, backBg `#9B2C2C`, text `#FFFFFF`, accent `#FEB2B2`
     - `ocean-blue`: frontBg `#2B6CB0`, backBg `#1A365D`, text `#FFFFFF`, accent `#BEE3F8`
     - `forest-green`: frontBg `#276749`, backBg `#1C4532`, text `#FFFFFF`, accent `#C6F6D5`
     - `sunset-orange`: frontBg `#DD6B20`, backBg `#7B341E`, text `#FFFFFF`, accent `#FEEBC8`
     - `midnight-dark`: frontBg `#1A202C`, backBg `#171923`, text `#E2E8F0`, accent `#A0AEC0`
     - `clean-white`: frontBg `#FFFFFF`, backBg `#F7FAFC`, text `#1A202C`, accent `#4A5568`
   - `getTemplateById(id: string): CardTemplate | undefined` 헬퍼 함수

### 기술적 접근

- 정적 데이터는 별도의 `src/data/` 디렉토리에 배치하여 컴포넌트와 분리
- `as const satisfies CardTemplate[]` 패턴으로 타입 안전성 확보
- 향후 템플릿 추가 시 배열에 항목만 추가하면 되는 확장 가능한 구조

### 완료 기준

- TypeScript 컴파일 에러 없음
- 6개 템플릿 데이터가 `CardTemplate` 타입에 부합
- `getTemplateById` 함수가 정상 동작

---

## Phase 2: TemplateGallery 컴포넌트 (Primary Goal)

**목표**: 템플릿 선택 UI를 구현합니다.

**관련 요구사항**: REQ-U-002, REQ-E-002, REQ-O-002

### 작업 항목

1. **`src/components/template/TemplateCard.tsx` 생성**
   - 개별 템플릿 미리보기 카드 컴포넌트
   - 앞면/뒷면 축소 미리보기 (카드 색상으로 렌더링)
   - 호버 시 `scale(1.05)` 효과
   - 선택된 상태 시각적 표시: 테두리 강조 + 체크마크 아이콘
   - 템플릿 이름(한국어) 표시

2. **`src/components/template/TemplateGallery.tsx` 생성**
   - CSS Grid 레이아웃: `grid-cols-2 md:grid-cols-3`
   - `DEFAULT_TEMPLATES` 데이터를 순회하며 `TemplateCard` 렌더링
   - "빈 명함으로 시작" 옵션 포함
   - 접근성: `role="radiogroup"`, `aria-label="명함 템플릿 선택"`
   - 각 TemplateCard에 `role="radio"`, `aria-checked`, 키보드 탐색 (Arrow keys)

3. **카테고리 필터 (Optional - REQ-O-002)**
   - 전체 / Business / Creative / Minimal 필터 탭
   - 선택된 카테고리에 따라 갤러리 항목 필터링

### 기술적 접근

- Tailwind CSS Grid로 반응형 레이아웃 구현
- `transition-transform` 유틸리티로 호버 애니메이션
- `useState`로 카테고리 필터 상태 관리 (로컬 상태)
- WAI-ARIA radiogroup 패턴으로 접근성 확보

### 완료 기준

- 6개 템플릿이 갤러리에 정상 표시
- 모바일/태블릿/데스크톱에서 반응형 동작
- 키보드로 템플릿 탐색 및 선택 가능

---

## Phase 3: Zustand Store 확장 (Primary Goal)

**목표**: 템플릿 적용 로직을 Zustand Store에 통합합니다.

**관련 요구사항**: REQ-E-001, REQ-E-003, REQ-S-001

### 작업 항목

1. **`useCardStore.ts` 확장**
   - `selectedTemplateId: string | null` 상태 추가
   - `applyTemplate(template: CardTemplate)` 액션 추가
   - 기존 `DEFAULT_CARD`의 배경색 값을 Classic Red 템플릿과 일치시킴

2. **`applyTemplate` 액션 구현**
   - `card.front.backgroundColor` <- `template.frontBackgroundColor`
   - `card.back.backgroundColor` <- `template.backBackgroundColor`
   - `selectedTemplateId` <- `template.id`
   - 콘텐츠 데이터(`displayName`, `avatarImage`, `fullName`, `title`, `hashtags`, `socialLinks`)는 보존

3. **기존 액션과의 호환성 확인**
   - `updateFront`/`updateBack`으로 배경색 직접 변경 시 `selectedTemplateId`를 `null`로 설정하지 않음 (사용자 커스텀 허용)
   - `resetCard` 시 `selectedTemplateId`도 초기값(`classic-red` 또는 `null`)으로 리셋

### 기술적 접근

- 기존 persist middleware 구조 유지
- `applyTemplate`은 spread operator로 기존 콘텐츠를 보존하면서 스타일만 덮어씀
- localStorage 마이그레이션: 기존 데이터에 `selectedTemplateId` 필드가 없는 경우 `null`로 초기화

### 완료 기준

- 템플릿 적용 시 배경색만 변경되고 콘텐츠 보존
- localStorage에 `selectedTemplateId` 포함하여 저장
- 기존 기능(편집, 내보내기, 리셋)에 영향 없음

---

## Phase 4: 편집기 통합 (Secondary Goal)

**목표**: TemplateGallery를 메인 편집기 페이지에 통합합니다.

**관련 요구사항**: REQ-E-001, REQ-E-002

### 작업 항목

1. **`page.tsx` 수정**
   - TemplateGallery 섹션을 에디터 영역에 추가
   - 에디터 패널 상단에 "템플릿 선택" 접이식(collapsible) 섹션으로 배치
   - 기존 편집 필드와의 시각적 분리

2. **TemplateGallery와 Store 연결**
   - `useCardStore`의 `applyTemplate` 액션을 TemplateCard 클릭에 연결
   - `selectedTemplateId`를 사용하여 현재 선택된 템플릿 표시

3. **UX 흐름 최적화**
   - 템플릿 선택 후 자동으로 편집 패널로 스크롤
   - 템플릿 변경 시 간단한 시각적 피드백 (색상 전환 트랜지션)

### 기술적 접근

- Collapsible 섹션은 `useState`와 `transition` 유틸리티로 구현
- 카드 배경색 변경 시 CSS `transition-colors` 적용으로 부드러운 전환
- 모바일에서는 갤러리가 가로 스크롤 가능한 리스트로 표시

### 완료 기준

- 편집기 페이지에서 템플릿 선택 가능
- 템플릿 적용 후 실시간으로 미리보기에 반영
- 기존 편집 워크플로우에 방해 없음

---

## Phase 5: 템플릿 프리뷰 렌더링 및 폴리시 (Secondary Goal)

**목표**: 갤러리 내 프리뷰 품질 향상 및 전반적인 UI 폴리시를 수행합니다.

**관련 요구사항**: REQ-O-001

### 작업 항목

1. **TemplateCard 프리뷰 향상**
   - 앞면/뒷면 축소 프리뷰에 실제 카드 레이아웃 반영
   - 텍스트 색상과 강조 색상을 프리뷰에 시각적으로 표현
   - 앞면/뒷면 전환 마이크로 인터랙션 (호버 시 뒷면 표시)

2. **반응형 디자인 폴리시**
   - 모바일 레이아웃 최적화 (갤러리 + 편집기 + 미리보기 균형)
   - 터치 디바이스에서 44px 최소 터치 영역 보장
   - 갤러리 스크롤 동작 최적화

3. **접근성 최종 검증**
   - 키보드 탐색 흐름 테스트
   - 스크린 리더 호환성 확인
   - 고대비 모드 호환성 확인

4. **커스텀 템플릿 저장 (Optional - REQ-O-001)**
   - 현재 색상 조합을 커스텀 템플릿으로 저장
   - localStorage에 사용자 커스텀 템플릿 배열 저장
   - 갤러리에 커스텀 템플릿 섹션 추가

### 기술적 접근

- CSS `transition` 속성으로 프리뷰 전환 효과
- `@media (pointer: coarse)` 쿼리로 터치 디바이스 최적화
- 커스텀 템플릿은 별도 localStorage 키(`namecard-custom-templates`)로 관리

### 완료 기준

- 갤러리 프리뷰가 실제 명함 디자인을 직관적으로 표현
- 모든 디바이스에서 정상 동작
- 접근성 기준 충족 (ARIA, 키보드, 터치)

---

## 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
| ------ | ---- | --------- |
| localStorage 마이그레이션 충돌 | 기존 사용자 데이터 유실 가능 | Zustand persist의 `version` + `migrate` 옵션 활용 |
| 갤러리 렌더링 성능 | 다수 프리뷰 렌더링 시 성능 저하 | CSS 기반 프리뷰로 DOM 최소화, `will-change` 최적화 |
| 접근성 미흡 | WCAG 기준 미달 | Phase 5에서 전용 접근성 테스트 수행 |
| 기존 기능 회귀 | 편집/내보내기/저장 기능 오작동 | Phase 3에서 기존 테스트 통과 확인 |

---

## 트레이서빌리티

| 요구사항  | Phase          | 주요 파일                                      |
| --------- | -------------- | ---------------------------------------------- |
| REQ-U-001 | Phase 1        | `src/types/template.ts`, `src/data/templates.ts` |
| REQ-U-002 | Phase 2        | `TemplateGallery.tsx`, `TemplateCard.tsx`         |
| REQ-E-001 | Phase 3, 4     | `useCardStore.ts`, `page.tsx`                    |
| REQ-E-002 | Phase 2, 4     | `TemplateGallery.tsx`, `page.tsx`                |
| REQ-E-003 | Phase 3        | `useCardStore.ts`                                |
| REQ-S-001 | Phase 3        | `useCardStore.ts` (`applyTemplate` 액션)         |
| REQ-O-001 | Phase 5        | `useCardStore.ts`, `TemplateGallery.tsx`         |
| REQ-O-002 | Phase 2        | `TemplateGallery.tsx`                            |
