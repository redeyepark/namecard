---
id: SPEC-FLOW-001
document: plan
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-FLOW-001 Implementation Plan

## 구현 개요

현재 단일 페이지 편집기(`/` route의 `page.tsx`)를 서비스형 명함 제작 플로우로 전환한다. 기존 SPEC-UI-001 컴포넌트를 최대한 재사용하면서, 랜딩 페이지, 위저드 프레임워크, 단계별 컴포넌트를 새로 구현한다.

---

## Phase 1: 랜딩 페이지 생성 및 Route 재구성

**Priority: High (Primary Goal)**

### 작업 내용

1. 기존 `src/app/page.tsx`(편집기 메인 페이지)를 `src/app/create/edit/page.tsx`로 이동
2. 새로운 `src/app/page.tsx`에 랜딩 페이지(LandingPage) 구현
3. `/create` route를 위한 `src/app/create/page.tsx` 생성
4. `/create/layout.tsx` 생성 (위저드 공통 레이아웃)

### 변경 파일

| 파일                                | 작업   | 설명                           |
| ----------------------------------- | ------ | ------------------------------ |
| `src/app/page.tsx`                  | 수정   | 랜딩 페이지로 교체             |
| `src/app/create/page.tsx`           | 신규   | 위저드 메인 페이지             |
| `src/app/create/edit/page.tsx`      | 신규   | 기존 편집기 이동 (SPEC-UI-001) |
| `src/app/create/layout.tsx`         | 신규   | /create 공통 레이아웃          |
| `src/components/landing/LandingPage.tsx` | 신규 | 랜딩 페이지 컴포넌트          |

### 랜딩 페이지 구성 요소

- Hero Section: 서비스 소개 타이틀, 설명 문구
- CTA 버튼: "명함 만들기" (-> `/create`로 이동)
- 미리보기 이미지: 참조 디자인 기반 명함 샘플
- Feature 소개: 주요 기능 3-4개 간략 소개

### 위험 요소

- 기존 편집기 페이지 이동 시 import 경로 깨질 수 있음 -> 상대 경로 대신 `@/` alias 사용으로 대응

---

## Phase 2: Wizard 컴포넌트 프레임워크

**Priority: High (Primary Goal)**

### 작업 내용

1. `WizardContainer` 컴포넌트 구현 (위저드 전체 래퍼)
2. `ProgressBar` 컴포넌트 구현 (5단계 진행 표시기)
3. Step 네비게이션 로직 구현 (다음/이전/직접 이동)
4. Step 전환 애니메이션 구현 (Tailwind CSS transitions)

### 변경 파일

| 파일                                        | 작업 | 설명                        |
| ------------------------------------------- | ---- | --------------------------- |
| `src/components/wizard/WizardContainer.tsx` | 신규 | 위저드 메인 컨테이너        |
| `src/components/wizard/ProgressBar.tsx`     | 신규 | 단계 진행 표시기            |
| `src/components/wizard/StepNavigation.tsx`  | 신규 | 이전/다음 버튼 영역         |
| `src/components/wizard/MiniPreview.tsx`     | 신규 | 실시간 미니 미리보기        |

### WizardContainer 설계

```
WizardContainer
├── ProgressBar          (상단: 5단계 진행 표시)
├── MiniPreview          (우측 또는 상단: 축소 명함 미리보기)
├── StepContent          (중앙: 현재 단계 컴포넌트 렌더링)
│   ├── PersonalInfoStep
│   ├── PhotoUploadStep
│   ├── SocialTagStep
│   ├── PreviewStep
│   └── CompleteStep
└── StepNavigation       (하단: 이전/다음 버튼)
```

### ProgressBar 설계

- 5개 원형 아이콘 + 연결 라인
- 현재 단계: 강조 색상(Primary) + 활성 아이콘
- 완료 단계: 체크 아이콘 + 클릭 가능
- 미완료 단계: 비활성 색상 + 클릭 불가
- ARIA: `aria-current="step"`, `aria-label` 적용

---

## Phase 3: 단계별 Step 컴포넌트

**Priority: High (Primary Goal)**

### 작업 내용

1. `PersonalInfoStep` 구현 (Step 1: 이름, 직함 입력)
2. `PhotoUploadStep` 구현 (Step 2: 사진 업로드, 배경색 선택)
3. `SocialTagStep` 구현 (Step 3: 해시태그, 소셜 링크)
4. `PreviewStep` 구현 (Step 4: 전체 미리보기, 상세 편집 링크)
5. `CompleteStep` 구현 (Step 5: 내보내기, 새 명함 만들기)

### 변경 파일

| 파일                                          | 작업 | 설명                      |
| --------------------------------------------- | ---- | ------------------------- |
| `src/components/wizard/PersonalInfoStep.tsx`  | 신규 | Step 1: 개인 정보 입력    |
| `src/components/wizard/PhotoUploadStep.tsx`   | 신규 | Step 2: 사진 및 배경      |
| `src/components/wizard/SocialTagStep.tsx`     | 신규 | Step 3: 소셜 및 태그      |
| `src/components/wizard/PreviewStep.tsx`       | 신규 | Step 4: 미리보기          |
| `src/components/wizard/CompleteStep.tsx`      | 신규 | Step 5: 완료 및 내보내기  |

### 컴포넌트별 상세

**PersonalInfoStep (Step 1)**
- Display Name 입력 (필수, 최대 40자)
- Full Name 입력 (선택, 최대 50자)
- Title / Role 입력 (선택, 최대 80자)
- 필수 필드 유효성 검사 (빈 값 차단)
- 새 구현 (기존 컴포넌트 없음, 텍스트 입력 전용)

**PhotoUploadStep (Step 2)**
- `ImageUploader` 컴포넌트 재사용 (SPEC-UI-001)
- `ColorPicker` 컴포넌트 재사용 (앞면/뒷면 배경색)
- 업로드된 이미지 미리보기

**SocialTagStep (Step 3)**
- `HashtagEditor` 컴포넌트 재사용 (SPEC-UI-001)
- `SocialLinkEditor` 컴포넌트 재사용 (SPEC-UI-001)

**PreviewStep (Step 4)**
- `CardFront` / `CardBack` 컴포넌트 재사용 (전체 크기 미리보기)
- 앞면/뒷면 전환 기능 (`TabSwitch` 재사용)
- "상세 편집" 버튼 (-> `/create/edit` 라우팅)
- "완료" 버튼 (-> Step 5 이동)

**CompleteStep (Step 5)**
- `ExportButton` 컴포넌트 재사용 (PNG 내보내기)
- "새 명함 만들기" 버튼 (카드 초기화 + Step 1 이동)
- 완료 축하 메시지 및 안내

---

## Phase 4: Zustand Store 확장

**Priority: High (Secondary Goal)**

### 작업 내용

1. `useCardStore`에 위저드 상태 필드 추가 (`wizardStep`, `wizardCompleted`)
2. 위저드 액션 추가 (`setWizardStep`, `nextStep`, `prevStep`, `resetWizard`)
3. 단계별 유효성 검사 로직 추가
4. 기존 localStorage 데이터와의 하위 호환성 보장

### 변경 파일

| 파일                                     | 작업 | 설명                              |
| ---------------------------------------- | ---- | --------------------------------- |
| `src/stores/useCardStore.ts`             | 수정 | 위저드 상태 및 액션 추가          |
| `src/types/card.ts`                      | 수정 | WizardStep 타입 추가 (선택적)     |
| `src/lib/validation.ts`                  | 수정 | 단계별 유효성 검사 함수 추가      |
| `src/stores/__tests__/useCardStore.test.ts` | 수정 | 위저드 관련 테스트 추가        |

### Store 확장 설계

```typescript
// 위저드 상태 확장
interface CardStore {
  // 기존 상태 (변경 없음)
  card: CardData;
  activeSide: CardSide;

  // 위저드 상태 (신규)
  wizardStep: number;          // 1-5
  wizardCompleted: boolean;

  // 기존 액션 (변경 없음)
  updateFront: (data: Partial<CardFrontData>) => void;
  updateBack: (data: Partial<CardBackData>) => void;
  // ...

  // 위저드 액션 (신규)
  setWizardStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
}
```

### 하위 호환성

- 기존 `namecard-storage` localStorage 키 유지
- 새 필드(`wizardStep`, `wizardCompleted`)는 기본값으로 초기화
- 기존 데이터가 있는 경우 `wizardStep`은 자동으로 1로 설정

---

## Phase 5: 기존 편집기 통합

**Priority: Medium (Secondary Goal)**

### 작업 내용

1. `/create/edit` 페이지에서 기존 편집기 기능 유지
2. `/create/edit`에서 위저드로 돌아가기 버튼 추가
3. 위저드와 상세 편집기 간 데이터 동기화 확인
4. `beforeunload` 이벤트 핸들러로 데이터 손실 방지

### 변경 파일

| 파일                                   | 작업 | 설명                           |
| -------------------------------------- | ---- | ------------------------------ |
| `src/app/create/edit/page.tsx`         | 수정 | "위저드로 돌아가기" 버튼 추가  |
| `src/components/wizard/WizardContainer.tsx` | 수정 | beforeunload 핸들러 추가  |

---

## Phase 6: 애니메이션 및 마무리

**Priority: Medium (Final Goal)**

### 작업 내용

1. Step 전환 애니메이션 (Slide-in/out transition)
2. Progress Bar 애니메이션 (단계 완료 시 체크 마크 전환)
3. 반응형 디자인 최적화 (모바일 위저드 레이아웃)
4. 접근성 검증 (키보드 네비게이션, ARIA, 포커스 관리)
5. 전체 통합 테스트

### 변경 파일

| 파일                        | 작업 | 설명                    |
| --------------------------- | ---- | ----------------------- |
| `src/app/globals.css`       | 수정 | 위저드 전환 애니메이션  |
| 위저드 컴포넌트 전체        | 수정 | 반응형 레이아웃 조정    |

---

## 파일 변경 요약

### 신규 파일 (약 13개)

| 파일                                          | 설명                |
| --------------------------------------------- | ------------------- |
| `src/components/landing/LandingPage.tsx`      | 랜딩 페이지         |
| `src/app/create/page.tsx`                     | 위저드 라우트       |
| `src/app/create/layout.tsx`                   | 위저드 레이아웃     |
| `src/app/create/edit/page.tsx`                | 상세 편집 라우트    |
| `src/components/wizard/WizardContainer.tsx`   | 위저드 컨테이너     |
| `src/components/wizard/ProgressBar.tsx`       | 진행 표시기         |
| `src/components/wizard/StepNavigation.tsx`    | 단계 네비게이션     |
| `src/components/wizard/MiniPreview.tsx`       | 미니 미리보기       |
| `src/components/wizard/PersonalInfoStep.tsx`  | Step 1              |
| `src/components/wizard/PhotoUploadStep.tsx`   | Step 2              |
| `src/components/wizard/SocialTagStep.tsx`     | Step 3              |
| `src/components/wizard/PreviewStep.tsx`       | Step 4              |
| `src/components/wizard/CompleteStep.tsx`      | Step 5              |

### 수정 파일 (약 5개)

| 파일                                           | 변경 내용                          |
| ---------------------------------------------- | ---------------------------------- |
| `src/app/page.tsx`                             | 랜딩 페이지로 교체                 |
| `src/stores/useCardStore.ts`                   | 위저드 상태/액션 추가              |
| `src/lib/validation.ts`                        | 단계별 유효성 검사 함수 추가       |
| `src/app/globals.css`                          | 위저드 애니메이션 스타일 추가      |
| `src/stores/__tests__/useCardStore.test.ts`    | 위저드 테스트 케이스 추가          |

---

## Risk Analysis

### Risk 1: localStorage 마이그레이션 호환성

- **위험도**: Medium
- **설명**: 기존 `namecard-storage`에 저장된 데이터에 `wizardStep` 필드가 없어 스토어 초기화 시 오류 발생 가능
- **대응**: Zustand의 `merge` 옵션과 기본값 설정으로 새 필드를 안전하게 추가. `partialize` 옵션 활용 검토

### Risk 2: 기존 편집기 컴포넌트 커플링

- **위험도**: Low
- **설명**: SPEC-UI-001 컴포넌트가 특정 레이아웃 컨텍스트에 의존할 수 있음
- **대응**: 컴포넌트가 이미 독립적으로 설계되어 있으므로(`@/` import), 위저드 Step 내에서 props 전달만으로 재사용 가능

### Risk 3: Next.js App Router 네비게이션 동작

- **위험도**: Medium
- **설명**: 위저드 내부 단계 전환(클라이언트 상태)과 App Router 라우팅(서버 라우팅)이 혼합되어 뒤로가기 동작이 예상과 다를 수 있음
- **대응**: 위저드 내부 단계 전환은 클라이언트 상태로만 관리하고, Route 전환(/, /create, /create/edit)은 Next.js `useRouter`를 사용. `beforeunload`로 이탈 방지

### Risk 4: 미니 미리보기 성능

- **위험도**: Low
- **설명**: 매 입력마다 미니 미리보기가 리렌더링되어 성능 저하 가능
- **대응**: `React.memo`로 불필요한 리렌더링 방지. 미니 미리보기는 축소 버전이므로 렌더링 비용 낮음

---

## Dependencies

| 의존성              | 설명                                           | 상태     |
| ------------------- | ---------------------------------------------- | -------- |
| SPEC-UI-001         | 명함 편집기 컴포넌트 (재사용 대상)             | 완료     |
| Next.js App Router  | 파일 시스템 기반 라우팅                        | 사용 중  |
| Zustand 5           | 상태 관리 (persist middleware 포함)             | 사용 중  |
| Tailwind CSS 4      | 스타일링 및 애니메이션                         | 사용 중  |

---

## Traceability

| 요구사항    | Phase | 구현 대상                          |
| ----------- | ----- | ---------------------------------- |
| REQ-U-001   | 2     | ProgressBar                        |
| REQ-U-002   | 2     | MiniPreview                        |
| REQ-U-003   | 4     | useCardStore (wizardStep persist)  |
| REQ-E-001   | 1     | LandingPage CTA -> /create        |
| REQ-E-002   | 2     | StepNavigation (next/prev)         |
| REQ-E-003   | 3     | PreviewStep -> /create/edit        |
| REQ-E-004   | 3     | CompleteStep (resetWizard)         |
| REQ-E-005   | 2     | ProgressBar (클릭 이동)            |
| REQ-S-001   | 3     | PersonalInfoStep                   |
| REQ-S-002   | 3     | PhotoUploadStep                    |
| REQ-S-003   | 3     | SocialTagStep                      |
| REQ-S-004   | 3     | PreviewStep                        |
| REQ-N-001   | 3, 4  | PersonalInfoStep (validation)      |
| REQ-N-002   | 5     | WizardContainer (beforeunload)     |
