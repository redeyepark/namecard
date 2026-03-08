---
id: SPEC-UI-002
version: "1.0.0"
status: planned
created: "2026-03-08"
updated: "2026-03-08"
author: MoAI
priority: high
---

## HISTORY

| Version | Date       | Author | Changes               |
| ------- | ---------- | ------ | --------------------- |
| 1.0.0   | 2026-03-08 | MoAI   | Initial SPEC creation |

---

## Overview

Namecard 프로젝트의 디자인 시스템 통합 SPEC이다. 현재 165개 React 컴포넌트 중 84개(51%)가 하드코딩된 색상 값을 사용하고 있으며, UI 프리미티브 컴포넌트가 4개(Toast, TabSwitch, ResetButton, ToastProvider)만 존재한다. 이 SPEC은 디자인 토큰 통합, UI 프리미티브 컴포넌트 생성, 기존 컴포넌트 마이그레이션의 3개 모듈로 구성되어 디자인 시스템을 체계적으로 통합한다.

핵심 목표:

- CSS 커스텀 프로퍼티를 Tailwind CSS v4 테마 토큰으로 등록하여 일관된 스타일링 기반 구축
- 재사용 가능한 UI 프리미티브 컴포넌트(Button, Input, Modal, Badge, Avatar, Skeleton) 생성
- 84개 하드코딩 색상 컴포넌트를 디자인 토큰 기반으로 마이그레이션
- 카드 테마별 고유 색상(Pokemon, Hearthstone 등)은 html-to-image 내보내기 호환성을 위해 인라인 스타일 유지

---

## Environment

| 항목          | 설명                                                         |
| ------------- | ------------------------------------------------------------ |
| 프레임워크    | Next.js 16.1.6 (App Router) + React 19.2.3                  |
| 언어          | TypeScript 5.x (strict mode)                                 |
| 스타일링      | Tailwind CSS 4.x (CSS-first configuration)                   |
| 컴포넌트 수   | 165개 React 컴포넌트, 26개 기능 도메인                       |
| 이미지 내보내기 | html-to-image 1.11.13 (카드 컴포넌트 인라인 스타일 필수)    |
| 배포 환경     | Cloudflare Workers (@opennextjs/cloudflare)                  |
| 백엔드        | Supabase (PostgreSQL + Auth + Storage)                       |
| 상태 관리     | Zustand 5.0.11                                               |

---

## Assumptions

1. Tailwind CSS v4는 CSS-first configuration을 사용하며, `@theme` 디렉티브로 CSS 커스텀 프로퍼티를 직접 테마 토큰으로 등록할 수 있다.
2. 기존 globals.css에 정의된 15개 색상 토큰, 5개 반경 토큰, 4개 그림자 토큰이 디자인 시스템의 기초가 된다.
3. 카드 컴포넌트(CardFront, CardBack, 테마별 카드)는 html-to-image 내보내기를 위해 인라인 스타일을 사용해야 하므로 마이그레이션 대상에서 제외한다.
4. UI 프리미티브 컴포넌트는 서드파티 컴포넌트 라이브러리(shadcn/ui 등) 없이 자체 구현한다.
5. 마이그레이션은 기능 회귀 없이 점진적으로 수행되어야 한다.
6. 45개 고유 하드코딩 색상 값은 기존 15개 디자인 토큰과 추가 시맨틱 토큰으로 매핑할 수 있다.

---

## Requirements

### Module 1: Design Token Integration (디자인 토큰 통합)

#### Ubiquitous Requirements (항상 활성)

**REQ-U-001**: 시스템은 **항상** globals.css에 정의된 모든 CSS 커스텀 프로퍼티(--color-*, --radius-*, --shadow-*, --font-*)를 Tailwind CSS v4 `@theme` 디렉티브를 통해 테마 토큰으로 등록해야 한다.

**REQ-U-002**: 시스템은 **항상** 시맨틱 색상 별칭(semantic color aliases)을 제공하여, 컴포넌트에서 `bg-primary`, `text-primary`, `border-default` 등의 Tailwind 유틸리티 클래스로 디자인 토큰에 접근할 수 있어야 한다.

**REQ-U-003**: 시스템은 **항상** 통합된 포커스 링 스타일(`focus-visible:ring-2 ring-primary/30`)을 디자인 토큰으로 정의하여 모든 인터랙티브 요소에 일관되게 적용해야 한다.

#### Event-Driven Requirements (이벤트 기반)

**REQ-E-001**: **WHEN** 새로운 컴포넌트가 생성되면 **THEN** 해당 컴포넌트는 하드코딩된 색상 값 대신 반드시 디자인 토큰 기반 Tailwind 유틸리티 클래스를 사용해야 한다.

#### State-Driven Requirements (상태 기반)

**REQ-S-001**: **IF** 다크 모드 확장이 필요한 상태라면 **THEN** 디자인 토큰 구조는 `:root`와 `.dark` 선택자 분리를 통해 다크 모드 토큰을 추가할 수 있는 확장 가능한 구조여야 한다.

#### Unwanted Behavior Requirements (금지 사항)

**REQ-N-001**: 시스템은 Tailwind 기본 색상 팔레트(gray-300, blue-500, red-600 등)를 프로젝트 디자인 토큰과 혼용**하지 않아야 한다**. 프로젝트 고유 토큰만 사용한다.

#### Optional Requirements (선택 사항)

**REQ-O-001**: **가능하면** 스페이싱 스케일 표준(4px 기반: 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32)을 정의하여 일관된 간격 체계를 제공한다.

---

### Module 2: UI Primitive Components (UI 프리미티브 컴포넌트)

#### Ubiquitous Requirements (항상 활성)

**REQ-U-004**: 시스템은 **항상** 모든 UI 프리미티브 컴포넌트가 디자인 토큰만을 사용하고, 하드코딩된 색상 값을 포함하지 않아야 한다.

**REQ-U-005**: 시스템은 **항상** 모든 UI 프리미티브 컴포넌트가 TypeScript 타입 안전성을 보장하며, `forwardRef`와 적절한 HTML 속성 전달(`...rest` props)을 지원해야 한다.

#### Event-Driven Requirements (이벤트 기반)

**REQ-E-002**: **WHEN** Button 컴포넌트가 렌더링되면 **THEN** variant(primary, secondary, accent, danger, ghost)와 size(sm, md, lg)에 따라 디자인 토큰 기반의 일관된 스타일이 적용되어야 한다.

- primary: `bg-primary text-secondary` (6가지 패딩 변형을 sm/md/lg 3단계로 표준화)
- secondary: `bg-surface text-primary border border-border-medium`
- accent: `bg-accent-orange text-primary`
- danger: `bg-red-600 text-white` (시맨틱 에러 토큰으로 대체 예정)
- ghost: `bg-transparent text-primary hover:bg-primary/5`
- sm: `px-3 py-1.5 text-sm`, md: `px-4 py-2 text-base`, lg: `px-6 py-2.5 text-lg`

**REQ-E-003**: **WHEN** Input 컴포넌트가 포커스를 받으면 **THEN** 통합 포커스 링 스타일(`focus-visible:ring-2 ring-primary/30 border-primary`)이 적용되어야 한다.

- 기존 불일치 상태: `ring-blue-500`, `ring-[#020912]/30`, `ring-gray-400` 혼용 해소

**REQ-E-004**: **WHEN** Modal 컴포넌트가 열리면 **THEN** 공유 베이스 컴포넌트를 통해 일관된 오버레이, 애니메이션, 닫기 동작이 적용되어야 한다.

- 기존 5개 별도 모달 구현체를 단일 베이스 컴포넌트로 통합

#### State-Driven Requirements (상태 기반)

**REQ-S-002**: **IF** Button에 `disabled` 상태가 적용되면 **THEN** `opacity-50 cursor-not-allowed` 스타일과 함께 클릭 이벤트가 차단되어야 한다.

**REQ-S-003**: **IF** Input에 `error` 상태가 적용되면 **THEN** `border-error text-error` 스타일과 함께 에러 메시지가 표시되어야 한다.

#### Unwanted Behavior Requirements (금지 사항)

**REQ-N-002**: UI 프리미티브 컴포넌트는 비즈니스 로직이나 API 호출을 포함**하지 않아야 한다**. 순수 프레젠테이셔널 컴포넌트로 유지한다.

#### Optional Requirements (선택 사항)

**REQ-O-002**: **가능하면** Skeleton 로딩 컴포넌트를 제공하여 데이터 로딩 상태의 일관된 UI를 제공한다.

**REQ-O-003**: **가능하면** Badge 컴포넌트(variant: default, success, warning, error, info)를 제공하여 상태 표시의 일관성을 확보한다.

---

### Module 3: Existing Component Migration (기존 컴포넌트 마이그레이션)

#### Ubiquitous Requirements (항상 활성)

**REQ-U-006**: 시스템은 **항상** 마이그레이션 대상 컴포넌트에서 하드코딩된 색상 값을 디자인 토큰 기반 Tailwind 유틸리티 클래스로 대체해야 한다.

**REQ-U-007**: 시스템은 **항상** 마이그레이션 후에도 기존 기능과 시각적 결과가 동일하게 유지되어야 한다 (시각적 회귀 없음).

#### Event-Driven Requirements (이벤트 기반)

**REQ-E-005**: **WHEN** 인라인 버튼/입력/모달 패턴이 발견되면 **THEN** 해당 패턴을 Module 2에서 생성된 UI 프리미티브 컴포넌트로 교체해야 한다.

#### State-Driven Requirements (상태 기반)

**REQ-S-004**: **IF** 컴포넌트가 카드 내보내기(html-to-image) 렌더링 파이프라인에 포함되면 **THEN** 해당 컴포넌트의 인라인 스타일은 마이그레이션 대상에서 제외해야 한다.

**REQ-S-005**: **IF** 컴포넌트가 카드 테마별 고유 색상(Pokemon, Hearthstone, Harry Potter, Tarot, SNS Profile 등)을 사용하면 **THEN** 테마 특화 색상은 인라인 스타일로 유지하고 공통 레이아웃/구조 스타일만 토큰화해야 한다.

#### Unwanted Behavior Requirements (금지 사항)

**REQ-N-003**: 마이그레이션 과정에서 카드 내보내기 기능(html-to-image 기반 PNG 생성)의 출력 품질이 저하**되지 않아야 한다**.

**REQ-N-004**: 마이그레이션 과정에서 기존 반응형 레이아웃(320px+ 뷰포트)이 깨지**지 않아야 한다**.

#### Optional Requirements (선택 사항)

**REQ-O-004**: **가능하면** border-radius 사용을 표준화하여, 글로벌 기본값(0px)과 컴포넌트별 명시적 반경 토큰(radius-sm: 8px, radius-md: 12px, radius-lg: 16px) 사용을 일관되게 적용한다.

---

## Specifications

### Technical Constraints

| 항목                    | 기술 스택 / 제약                                              |
| ----------------------- | ------------------------------------------------------------- |
| Framework               | Next.js 16.1.6 (App Router) + React 19.2.3                   |
| Language                | TypeScript 5.x (strict mode)                                  |
| Styling                 | Tailwind CSS 4.x (CSS-first config, `@theme` directive)      |
| Image Export            | html-to-image 1.11.13 (카드 컴포넌트 인라인 스타일 필수)     |
| Component Architecture  | forwardRef + rest props 패턴, 서버/클라이언트 컴포넌트 호환   |
| Design Token Location   | `src/app/globals.css` (`:root` 선택자 내)                     |
| UI Primitive Location   | `src/components/ui/` 디렉토리                                 |

### Color Token Mapping (하드코딩 -> 디자인 토큰)

| 하드코딩 값                  | 사용 횟수 | 매핑 토큰                       | Tailwind 클래스          |
| ---------------------------- | --------- | ------------------------------- | ------------------------ |
| `#020912`                    | 775       | `--color-primary`               | `bg-primary`, `text-primary` |
| `rgba(2,9,18,0.15)`         | 147       | `--color-border-medium`         | `border-border-medium`   |
| `#fcfcfc`                    | 74        | `--color-secondary`             | `bg-secondary`           |
| `#e4f6ff`                    | 28        | `--color-accent-blue`           | `bg-accent-blue`         |
| `#ffa639`                    | 20        | `--color-accent-orange`         | `bg-accent-orange`       |
| `#F8F9FA`                    | -         | `--color-bg`                    | `bg-bg`                  |
| `#FFFFFF`                    | -         | `--color-surface`               | `bg-surface`             |
| `#1A1A1A`                    | -         | `--color-text-primary`          | `text-text-primary`      |
| `#6B7280`                    | -         | `--color-text-secondary`        | `text-text-secondary`    |
| `#9CA3AF`                    | -         | `--color-text-tertiary`         | `text-text-tertiary`     |
| `rgba(2,9,18,0.08)`         | -         | `--color-border-light`          | `border-border-light`    |
| `rgba(252,252,252,0.15)`    | -         | `--color-border-dark`           | `border-border-dark`     |
| `#E5E7EB`                    | -         | `--color-divider`               | `border-divider`         |
| `#dbe9e0`                    | -         | `--color-accent-green`          | `bg-accent-green`        |
| `#ffdfc8`                    | -         | `--color-accent-peach`          | `bg-accent-peach`        |

### 추가 시맨틱 토큰 (신규 정의 필요)

| 토큰 이름                    | 값               | 용도                             |
| ---------------------------- | ---------------- | -------------------------------- |
| `--color-error`              | `#DC2626`        | 에러 상태, 위험 액션             |
| `--color-success`            | `#16A34A`        | 성공 상태, 완료 표시             |
| `--color-warning`            | `#D97706`        | 경고 상태                        |
| `--color-info`               | `#2563EB`        | 정보 상태                        |
| `--color-focus-ring`         | `rgba(2,9,18,0.3)` | 통합 포커스 링 색상           |

### UI Primitive Component Specification

| 컴포넌트  | 파일 경로                          | Variants                                    | Sizes      |
| --------- | ---------------------------------- | ------------------------------------------- | ---------- |
| Button    | `src/components/ui/Button.tsx`     | primary, secondary, accent, danger, ghost   | sm, md, lg |
| Input     | `src/components/ui/Input.tsx`      | default, error                               | sm, md, lg |
| Textarea  | `src/components/ui/Textarea.tsx`   | default, error                               | -          |
| Select    | `src/components/ui/Select.tsx`     | default, error                               | sm, md, lg |
| Modal     | `src/components/ui/Modal.tsx`      | default, fullscreen                          | sm, md, lg |
| Badge     | `src/components/ui/Badge.tsx`      | default, success, warning, error, info       | sm, md     |
| Avatar    | `src/components/ui/Avatar.tsx`     | circle, rounded                              | sm, md, lg |
| Skeleton  | `src/components/ui/Skeleton.tsx`   | text, circle, rect                           | -          |

### Architecture Overview

```
src/
├── app/
│   └── globals.css              # @theme 디렉티브로 디자인 토큰 등록
├── components/
│   ├── ui/                      # UI 프리미티브 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx            # (기존)
│   │   ├── TabSwitch.tsx        # (기존)
│   │   ├── ResetButton.tsx      # (기존)
│   │   ├── ToastProvider.tsx    # (기존)
│   │   └── index.ts             # barrel export
│   ├── card/                    # 카드 컴포넌트 (마이그레이션 제외)
│   ├── editor/                  # 편집기 컴포넌트 (마이그레이션 대상)
│   ├── community/               # 커뮤니티 컴포넌트 (마이그레이션 대상)
│   └── dashboard/               # 대시보드 컴포넌트 (마이그레이션 대상)
```

### Migration Scope

| 카테고리        | 컴포넌트 수 | 마이그레이션 여부 | 이유                                         |
| --------------- | ----------- | ----------------- | -------------------------------------------- |
| 카드 테마       | ~30         | 제외              | html-to-image 인라인 스타일 필수             |
| 편집기/폼       | ~25         | 대상              | 하드코딩 색상 + 인라인 패턴 다수             |
| 대시보드        | ~15         | 대상              | 하드코딩 색상, 비표준 버튼/입력              |
| 커뮤니티        | ~20         | 대상              | 하드코딩 색상, 모달 중복 구현                |
| 갤러리/공유     | ~10         | 대상              | 하드코딩 색상, 버튼 패턴 불일치              |
| 인증/관리       | ~10         | 대상              | 하드코딩 색상                                |
| 공통/레이아웃   | ~10         | 부분 대상         | 네비게이션, 푸터 등 일부만                   |

### Performance Requirements

| 항목                          | 기준값              |
| ----------------------------- | ------------------- |
| 디자인 토큰 번들 크기 증가    | 기존 대비 1KB 이내  |
| UI 프리미티브 번들 크기       | 컴포넌트당 2KB 이내 |
| 마이그레이션 후 LCP           | 기존과 동일 (2초 이내) |
| 카드 내보내기 품질            | 마이그레이션 전후 동일 |

---

## Traceability

| SPEC ID      | 관련 요구사항                    | 구현 대상                                      |
| ------------ | -------------------------------- | ---------------------------------------------- |
| SPEC-UI-002  | REQ-U-001, REQ-U-002, REQ-U-003 | globals.css @theme 디렉티브, 시맨틱 토큰        |
| SPEC-UI-002  | REQ-E-001, REQ-N-001            | 디자인 토큰 사용 가이드라인                     |
| SPEC-UI-002  | REQ-S-001, REQ-O-001            | 다크 모드 확장 구조, 스페이싱 스케일             |
| SPEC-UI-002  | REQ-U-004, REQ-U-005            | UI 프리미티브 공통 아키텍처                      |
| SPEC-UI-002  | REQ-E-002, REQ-E-003, REQ-E-004 | Button, Input, Modal 컴포넌트                   |
| SPEC-UI-002  | REQ-S-002, REQ-S-003, REQ-N-002 | 상태 스타일링, 프레젠테이셔널 원칙               |
| SPEC-UI-002  | REQ-O-002, REQ-O-003            | Skeleton, Badge 컴포넌트                        |
| SPEC-UI-002  | REQ-U-006, REQ-U-007            | 컴포넌트 마이그레이션 전략                       |
| SPEC-UI-002  | REQ-E-005                        | 인라인 패턴 -> UI 프리미티브 교체               |
| SPEC-UI-002  | REQ-S-004, REQ-S-005            | 카드 내보내기/테마 컴포넌트 제외 규칙            |
| SPEC-UI-002  | REQ-N-003, REQ-N-004            | 내보내기 품질 보존, 반응형 레이아웃 유지         |
| SPEC-UI-002  | REQ-O-004                        | border-radius 표준화                            |
