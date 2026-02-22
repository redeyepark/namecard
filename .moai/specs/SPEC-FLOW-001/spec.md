---
id: SPEC-FLOW-001
version: "1.0.0"
status: completed
created: "2026-02-21"
updated: "2026-02-22"
author: MoAI
priority: high
---

## HISTORY

| Version | Date       | Author | Changes               |
| ------- | ---------- | ------ | --------------------- |
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC creation |
| 1.1.0 | 2026-02-22 | MoAI | Status updated to completed - 6-step wizard with Supabase backend fully implemented |

---

# SPEC-FLOW-001: 명함 제작 서비스 플로우 및 입력 위저드

## Overview

현재 단일 페이지 편집기(SPEC-UI-001)로 구현된 명함 편집기를 서비스형 명함 제작 플로우로 전환한다. 사용자가 랜딩 페이지에서 시작하여, 단계별 위저드(Wizard)를 통해 개인 정보, 사진, 소셜/태그 정보를 순차적으로 입력하고, 미리보기 확인 후 명함을 완성하는 흐름을 구현한다.

핵심 변경 사항:
- 랜딩 페이지(`/`) 도입으로 서비스 진입점 제공
- 5단계 위저드 UI(`/create`)를 통한 단계별 데이터 입력
- 기존 상세 편집기(`/create/edit`)와의 연동
- Progress Indicator와 실시간 미니 미리보기 제공
- Wizard 상태의 localStorage 영속성 보장

---

## Environment

| 항목             | 설명                                                    |
| ---------------- | ------------------------------------------------------- |
| 플랫폼           | 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)   |
| 배포 환경        | Cloudflare Workers (@opennextjs/cloudflare)             |
| 디바이스         | 데스크톱, 태블릿, 모바일 (320px 이상 뷰포트)           |
| 네트워크         | Supabase 백엔드 연동 (온라인 필수)                      |
| 데이터 저장소    | Supabase PostgreSQL + localStorage                      |
| 기존 구현        | SPEC-UI-001 명함 편집기, SPEC-AUTH-001 인증 시스템, SPEC-DEPLOY-001 Cloudflare Workers 배포 |

---

## Assumptions

1. SPEC-UI-001에서 구현된 모든 편집 컴포넌트(FrontEditor, BackEditor, ImageUploader, ColorPicker, HashtagEditor, SocialLinkEditor)를 재활용한다.
2. 기존 `useCardStore` Zustand 스토어를 확장하여 위저드 상태를 관리한다.
3. 기존 `namecard-storage` localStorage 키와의 호환성을 유지한다.
4. 위저드는 순방향/역방향 탐색이 모두 가능하며, 각 단계의 입력 데이터는 즉시 저장된다.
5. 참조 디자인은 세로형(Portrait) 명함이며, 앞면은 빨간색 배경(#E53E3E), 뒷면은 진한 빨간색 배경(#9B2C2C)을 기본값으로 사용한다.
6. Supabase 백엔드를 사용하며, 의뢰 데이터는 서버에 저장된다.

---

## Requirements

### Ubiquitous Requirements (항상 활성)

**REQ-U-001**: 시스템은 **항상** 위저드의 현재 진행 상태를 Progress Indicator(단계 표시기)로 표시해야 한다. Progress Indicator는 전체 5단계 중 현재 위치, 완료된 단계, 미완료 단계를 시각적으로 구분하여 보여준다.

**REQ-U-002**: 시스템은 **항상** 위저드 진행 중 실시간 미니 미리보기(Mini Preview)를 제공하여, 사용자가 현재까지 입력한 데이터가 명함에 어떻게 반영되는지 즉시 확인할 수 있어야 한다.

**REQ-U-003**: 시스템은 **항상** 위저드의 현재 단계와 입력 데이터를 localStorage에 자동 저장하여, 브라우저를 닫거나 새로고침해도 위저드 상태가 복원되어야 한다.

### Event-Driven Requirements (이벤트 기반)

**REQ-E-001**: **WHEN** 사용자가 랜딩 페이지(`/`)의 CTA 버튼("명함 만들기")을 클릭하면 **THEN** 시스템은 위저드 페이지(`/create`)의 Step 1(개인 정보 입력)으로 이동해야 한다.

**REQ-E-002**: **WHEN** 사용자가 위저드에서 "다음" 버튼을 클릭하면 **THEN** 시스템은 현재 단계의 입력값을 저장하고 다음 단계로 전환해야 한다. **WHEN** 사용자가 "이전" 버튼을 클릭하면 **THEN** 시스템은 이전 단계로 돌아가되 입력된 데이터를 유지해야 한다.

**REQ-E-003**: **WHEN** 사용자가 미리보기 단계(Step 4)에서 "상세 편집" 버튼을 클릭하면 **THEN** 시스템은 기존 상세 편집 모드(`/create/edit`)로 전환하여 SPEC-UI-001의 전체 편집기 인터페이스를 제공해야 한다.

**REQ-E-004**: **WHEN** 사용자가 완료 단계(Step 5)에서 "새 명함 만들기" 버튼을 클릭하면 **THEN** 시스템은 카드 데이터를 초기화하고 위저드를 Step 1부터 다시 시작해야 한다.

**REQ-E-005**: **WHEN** 사용자가 Progress Indicator의 이전 완료 단계를 클릭하면 **THEN** 시스템은 해당 단계로 직접 이동할 수 있어야 한다.

### State-Driven Requirements (상태 기반)

**REQ-S-001**: **IF** 위저드가 Step 1(개인 정보 입력) 상태라면 **THEN** 시스템은 Display Name과 Full Name 입력 필드, 그리고 Title/Role 입력 필드를 표시해야 한다.

**REQ-S-002**: **IF** 위저드가 Step 2(사진 업로드) 상태라면 **THEN** 시스템은 아바타 이미지 업로드 영역(Drag & Drop, 파일 선택)과 앞면/뒷면 배경색 선택기를 표시해야 한다.

**REQ-S-003**: **IF** 위저드가 Step 3(소셜/태그 입력) 상태라면 **THEN** 시스템은 Hashtag 편집기와 Social Link 편집기(추가/수정/삭제)를 표시해야 한다.

**REQ-S-004**: **IF** 위저드가 Step 4(미리보기) 상태라면 **THEN** 시스템은 명함 앞면과 뒷면의 전체 크기 미리보기와 함께 "상세 편집" 버튼 및 "완료" 버튼을 표시해야 한다.

### Unwanted Behavior Requirements (금지 사항)

**REQ-N-001**: 시스템은 필수 입력 필드(Display Name)가 비어 있는 상태에서 다음 단계로의 이동을 허용**하지 않아야 한다**. 빈 필수 필드가 있으면 해당 필드에 유효성 검사 오류 메시지를 표시해야 한다.

**REQ-N-002**: 시스템은 위저드 진행 중 브라우저 뒤로가기 또는 페이지 이탈 시 데이터 손실이 발생**하지 않아야 한다**. 미저장 데이터가 있으면 이탈 확인 다이얼로그를 표시하거나, 자동 저장 메커니즘으로 데이터를 보존해야 한다.

---

## Specifications

### Architecture Overview

#### Route 구조

| Route           | 설명                          | 컴포넌트                |
| --------------- | ----------------------------- | ----------------------- |
| `/`             | 랜딩 페이지 (서비스 소개)     | LandingPage             |
| `/create`       | 위저드 (5단계 입력 플로우)    | WizardContainer         |
| `/create/edit`  | 상세 편집기 (SPEC-UI-001)     | DetailEditor (기존 Home)|

#### Wizard Steps

```
Step 1: 개인 정보 입력 (PersonalInfoStep)
  - Display Name (필수)
  - Full Name
  - Title / Role
    |
    v
Step 2: 사진 및 배경 (PhotoUploadStep)
  - Avatar Image 업로드 (Drag & Drop / 파일 선택)
  - 앞면 배경색 선택
  - 뒷면 배경색 선택
    |
    v
Step 3: 소셜 및 태그 (SocialTagStep)
  - Hashtags 추가/삭제
  - Social Links 추가/수정/삭제
    |
    v
Step 4: 미리보기 (PreviewStep)
  - 앞면/뒷면 전체 미리보기
  - "상세 편집" 버튼 -> /create/edit
  - "완료" 버튼 -> Step 5
    |
    v
Step 5: 완료 (CompleteStep)
  - PNG 내보내기 (앞면/뒷면)
  - "새 명함 만들기" 버튼
  - 공유 옵션 안내
```

#### 상태 관리 (Zustand Store 확장)

기존 `useCardStore`에 위저드 관련 상태를 추가한다:

```typescript
interface CardStore {
  // ... 기존 CardData 상태 및 액션 유지 ...

  // Wizard 상태 확장
  wizardStep: number;            // 현재 위저드 단계 (1-5)
  wizardCompleted: boolean;      // 위저드 완료 여부
  setWizardStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;       // 위저드 초기화 (Step 1로)
}
```

#### 컴포넌트 재사용 전략 (SPEC-UI-001)

| SPEC-UI-001 컴포넌트   | 위저드 재사용 단계      | 재사용 방식            |
| ---------------------- | ---------------------- | ---------------------- |
| ImageUploader          | Step 2 (사진 업로드)   | 그대로 재사용          |
| ColorPicker            | Step 2 (배경색 선택)   | 그대로 재사용          |
| HashtagEditor          | Step 3 (태그 입력)     | 그대로 재사용          |
| SocialLinkEditor       | Step 3 (소셜 링크)     | 그대로 재사용          |
| CardFront / CardBack   | Step 4 (미리보기)      | 그대로 재사용          |
| CardPreview            | 미니 미리보기          | 축소 버전으로 래핑     |
| ExportButton           | Step 5 (완료/내보내기) | 그대로 재사용          |
| FrontEditor/BackEditor | /create/edit 상세 편집 | 기존 페이지에서 재사용 |

### Technical Constraints

| 항목               | 기술 스택                                          |
| ------------------ | -------------------------------------------------- |
| Framework          | Next.js 16 (App Router)                            |
| Language           | TypeScript 5.x                                     |
| Styling            | Tailwind CSS 4                                     |
| State Management   | Zustand 5 (localStorage persist middleware 포함)   |
| Routing            | Next.js App Router (파일 시스템 기반 라우팅)       |
| Animation          | Tailwind CSS 4 Transitions + CSS Keyframes         |
| Backend            | Supabase (PostgreSQL + Auth + Storage)             |
| localStorage 호환  | 기존 `namecard-storage` 키와 하위 호환성 유지      |

### Performance Requirements

| 항목                     | 기준값          |
| ------------------------ | --------------- |
| 단계 전환 애니메이션     | 300ms 이내      |
| 미니 미리보기 업데이트   | 100ms 이내      |
| 위저드 상태 복원         | 500ms 이내      |
| 랜딩 페이지 LCP          | 1.5초 이내      |

### Accessibility Requirements

| 항목                     | 기준                                               |
| ------------------------ | -------------------------------------------------- |
| 키보드 네비게이션        | Tab, Enter, Space로 전체 위저드 탐색 가능          |
| ARIA                     | Progress Indicator에 aria-current, aria-label 적용 |
| Focus 관리               | 단계 전환 시 새 단계의 첫 입력 필드에 자동 포커스  |
| 터치 타겟                | 최소 44px 터치 영역 보장                           |
| 반응형                   | 320px 이상 뷰포트에서 정상 작동                    |

---

## Traceability

| SPEC ID        | 관련 요구사항                    | 구현 대상                                    |
| -------------- | -------------------------------- | -------------------------------------------- |
| SPEC-FLOW-001  | REQ-U-001                        | ProgressBar 컴포넌트                         |
| SPEC-FLOW-001  | REQ-U-002                        | MiniPreview 컴포넌트                         |
| SPEC-FLOW-001  | REQ-U-003                        | useCardStore (wizardStep persist)            |
| SPEC-FLOW-001  | REQ-E-001                        | LandingPage CTA -> /create 라우팅            |
| SPEC-FLOW-001  | REQ-E-002                        | WizardContainer (nextStep/prevStep)          |
| SPEC-FLOW-001  | REQ-E-003                        | PreviewStep -> /create/edit 라우팅           |
| SPEC-FLOW-001  | REQ-E-004                        | CompleteStep (resetWizard + 라우팅)          |
| SPEC-FLOW-001  | REQ-E-005                        | ProgressBar (클릭으로 단계 이동)             |
| SPEC-FLOW-001  | REQ-S-001                        | PersonalInfoStep 컴포넌트                    |
| SPEC-FLOW-001  | REQ-S-002                        | PhotoUploadStep 컴포넌트                     |
| SPEC-FLOW-001  | REQ-S-003                        | SocialTagStep 컴포넌트                       |
| SPEC-FLOW-001  | REQ-S-004                        | PreviewStep 컴포넌트                         |
| SPEC-FLOW-001  | REQ-N-001                        | PersonalInfoStep (필수 필드 유효성 검사)     |
| SPEC-FLOW-001  | REQ-N-002                        | WizardContainer (beforeunload + 자동 저장)   |
| SPEC-UI-001    | 전체                             | /create/edit 상세 편집기 (기존 구현 재사용)  |
