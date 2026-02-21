---
id: SPEC-TPL-001
version: "1.0.0"
status: draft
created: "2026-02-21"
updated: "2026-02-21"
author: MoAI
priority: medium
---

## HISTORY

| 버전  | 날짜       | 작성자 | 변경 내용            |
| ----- | ---------- | ------ | -------------------- |
| 1.0.0 | 2026-02-21 | MoAI   | 초기 SPEC 문서 작성  |

---

# SPEC-TPL-001: 명함 디자인 템플릿 시스템

## 요약

사용자가 빈 명함부터 시작하지 않고, 미리 디자인된 카드 템플릿을 선택하여 빠르게 명함을 제작할 수 있는 템플릿 시스템을 구현합니다. 최소 6개의 기본 제공 템플릿(Classic Red, Ocean Blue, Forest Green, Sunset Orange, Midnight Dark, Clean White)을 갤러리 형태로 제공하며, 템플릿 선택 시 배경색, 텍스트 색상, 강조 색상이 자동 적용됩니다. 사용자가 이미 입력한 텍스트, 이미지, 소셜 링크 등의 콘텐츠 데이터는 템플릿 전환 시에도 보존됩니다.

## 배경 (Environment)

- **프로젝트**: Namecard Editor - Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand 5 기반 클라이언트 사이드 SPA
- **현재 상태**: SPEC-UI-001 완료 - 기본 명함 편집기 구현 완료 (앞면/뒷면 편집, PNG 내보내기, localStorage 저장)
- **현재 기본값**: 앞면 배경색 `#E53E3E` (빨간색), 뒷면 배경색 `#9B2C2C` (다크 레드) - 이것이 "Classic Red" 템플릿의 기반
- **참조 디자인**: 앞면은 빨간 배경에 상단 Display Name + 일러스트 아바타, 뒷면은 다크 레드 배경에 Full Name, Title, Hashtags, 하단 소셜 링크

## 가정 (Assumptions)

- 템플릿은 정적 데이터로 관리되며, 서버 API 호출 없이 클라이언트 코드에 포함됨
- 템플릿은 배경색 및 텍스트/강조 색상 조합만 정의하며, 레이아웃 변경은 포함하지 않음
- 기존 `CardData` 인터페이스 구조는 유지하되, 템플릿 관련 타입을 추가 정의함
- 템플릿 선택은 기존 편집 워크플로우에 자연스럽게 통합됨
- localStorage persist 구조는 기존 `namecard-storage` 키를 그대로 사용

---

## 요구사항 (Requirements)

### Ubiquitous (보편적 요구사항)

**REQ-U-001**: 시스템은 **항상** 최소 6개의 기본 제공 템플릿(Classic Red, Ocean Blue, Forest Green, Sunset Orange, Midnight Dark, Clean White)을 포함해야 한다.

**REQ-U-002**: 시스템은 **항상** 템플릿 갤러리에서 각 템플릿의 앞면/뒷면 미리보기를 제공해야 한다.

### Event-Driven (이벤트 기반 요구사항)

**REQ-E-001**: **WHEN** 사용자가 템플릿 갤러리에서 템플릿을 선택 **THEN** 해당 템플릿의 배경색, 텍스트 색상, 강조 색상이 명함에 즉시 적용된다.

**REQ-E-002**: **WHEN** 사용자가 "빈 명함으로 시작" 옵션을 선택 **THEN** 기본 흰색 배경의 빈 명함 편집 상태로 시작한다.

**REQ-E-003**: **WHEN** 사용자가 템플릿 적용 후 색상을 직접 수정 **THEN** 사용자가 수정한 색상 값이 템플릿 기본값을 덮어쓰며 유지된다.

### State-Driven (상태 기반 요구사항)

**REQ-S-001**: **IF** 사용자가 이미 텍스트, 이미지, 해시태그, 소셜 링크 등의 콘텐츠를 입력한 상태 **AND WHEN** 다른 템플릿으로 전환 **THEN** 기존 콘텐츠 데이터는 보존되고 스타일(배경색, 텍스트 색상, 강조 색상)만 변경된다.

### Optional (선택적 요구사항)

**REQ-O-001**: **가능하면** 사용자가 현재 편집 중인 색상 조합을 커스텀 템플릿으로 저장하는 기능을 제공한다.

**REQ-O-002**: **가능하면** 템플릿 갤러리에서 카테고리별(business, creative, minimal) 필터링 기능을 제공한다.

---

## 명세 (Specifications)

### 1. 템플릿 데이터 정의

총 6개의 기본 제공 템플릿을 다음과 같이 정의합니다:

| 템플릿 이름       | ID              | 카테고리   | 앞면 배경색 | 뒷면 배경색 | 텍스트 색상 | 강조 색상 |
| ----------------- | --------------- | ---------- | ----------- | ----------- | ----------- | --------- |
| Classic Red       | `classic-red`   | business   | `#E53E3E`   | `#9B2C2C`   | `#FFFFFF`   | `#FEB2B2` |
| Ocean Blue        | `ocean-blue`    | business   | `#2B6CB0`   | `#1A365D`   | `#FFFFFF`   | `#BEE3F8` |
| Forest Green      | `forest-green`  | creative   | `#276749`   | `#1C4532`   | `#FFFFFF`   | `#C6F6D5` |
| Sunset Orange     | `sunset-orange` | creative   | `#DD6B20`   | `#7B341E`   | `#FFFFFF`   | `#FEEBC8` |
| Midnight Dark     | `midnight-dark` | minimal    | `#1A202C`   | `#171923`   | `#E2E8F0`  | `#A0AEC0` |
| Clean White       | `clean-white`   | minimal    | `#FFFFFF`   | `#F7FAFC`   | `#1A202C`  | `#4A5568` |

### 2. 신규 타입 정의

```typescript
// src/types/template.ts

export type TemplateCategory = 'business' | 'creative' | 'minimal';

export interface CardTemplate {
  id: string;
  name: string;
  nameKo: string;
  category: TemplateCategory;
  frontBackgroundColor: string;
  backBackgroundColor: string;
  textColor: string;
  accentColor: string;
  preview?: {
    front: string;
    back: string;
  };
}
```

### 3. 아키텍처 설계

#### 3.1 파일 구조

```
src/
├── data/
│   └── templates.ts              # 정적 템플릿 데이터 배열 (DEFAULT_TEMPLATES)
├── types/
│   ├── card.ts                   # 기존 CardData, CardFrontData, CardBackData 유지
│   └── template.ts               # CardTemplate, TemplateCategory 타입 정의
├── components/
│   └── template/
│       ├── TemplateGallery.tsx    # 템플릿 갤러리 컨테이너 (CSS Grid 레이아웃)
│       └── TemplateCard.tsx       # 개별 템플릿 미리보기 카드 (앞면/뒷면 프리뷰, 호버 효과)
└── stores/
    └── useCardStore.ts           # applyTemplate 액션 추가, selectedTemplateId 상태 추가
```

#### 3.2 Zustand Store 확장

기존 `CardStore` 인터페이스에 다음을 추가합니다:

```typescript
interface CardStore {
  // ... existing fields
  selectedTemplateId: string | null;
  applyTemplate: (template: CardTemplate) => void;
}
```

`applyTemplate` 액션은 다음 필드만 업데이트합니다:
- `card.front.backgroundColor` -> `template.frontBackgroundColor`
- `card.back.backgroundColor` -> `template.backBackgroundColor`
- `selectedTemplateId` -> `template.id`

콘텐츠 데이터(`displayName`, `avatarImage`, `fullName`, `title`, `hashtags`, `socialLinks`)는 변경하지 않습니다.

#### 3.3 TemplateGallery 컴포넌트

- CSS Grid 레이아웃: 모바일 2열, 태블릿 3열, 데스크톱 3열
- 각 TemplateCard는 앞면/뒷면 축소 미리보기를 표시
- 호버 시 카드 확대(scale) 효과
- 현재 선택된 템플릿에 시각적 강조(border, checkmark) 표시
- 접근성: `role="radiogroup"`, 각 카드는 `role="radio"`, 키보드 탐색 지원

#### 3.4 편집기 통합

- 메인 에디터 페이지(`page.tsx`)에 TemplateGallery 섹션 추가
- 에디터 패널 상단 또는 별도 섹션으로 배치
- 템플릿 선택과 수동 색상 편집이 자연스럽게 공존

---

## 트레이서빌리티 (Traceability)

| 요구사항   | plan.md 연결          | acceptance.md 연결 |
| ---------- | --------------------- | ------------------ |
| REQ-U-001  | Phase 1: 템플릿 데이터 | AC-001             |
| REQ-U-002  | Phase 2: 갤러리 컴포넌트 | AC-002           |
| REQ-E-001  | Phase 3: Store 확장   | AC-003             |
| REQ-E-002  | Phase 2: 갤러리 컴포넌트 | AC-004           |
| REQ-E-003  | Phase 3: Store 확장   | AC-005             |
| REQ-S-001  | Phase 3: Store 확장   | AC-006             |
| REQ-O-001  | Phase 5: 폴리시       | AC-007             |
| REQ-O-002  | Phase 2: 갤러리 컴포넌트 | AC-008           |
