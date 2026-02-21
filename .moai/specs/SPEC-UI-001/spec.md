---
id: SPEC-UI-001
version: "1.1.0"
status: completed
created: "2026-02-21"
updated: "2026-02-21"
author: MoAI
priority: high
---

## HISTORY

| Version | Date       | Author | Changes              |
| ------- | ---------- | ------ | -------------------- |
| 1.0.0   | 2026-02-21 | MoAI   | Initial SPEC creation |
| 1.1.0   | 2026-02-21 | MoAI   | Implementation completed - all 12 requirements fulfilled |

---

## Overview

명함 편집기 웹 애플리케이션(Namecard Editor)은 사용자가 브라우저에서 직접 개인 명함의 앞면과 뒷면을 디자인하고 편집할 수 있는 클라이언트 사이드 전용 웹 애플리케이션이다.

주요 기능은 다음과 같다:

- 명함 앞면: 빨간색 배경, 디스플레이 이름, 아바타 일러스트레이션 표시
- 명함 뒷면: 진한 빨간색 배경, 전체 이름, 직함, 해시태그, 소셜 미디어 링크 표시
- 실시간 미리보기를 통한 WYSIWYG 편집 경험
- PNG 이미지로 내보내기 기능
- 브라우저 로컬 스토리지 기반 데이터 자동 저장

이 애플리케이션은 서버 없이 순수 클라이언트 사이드로 동작하며, Vercel에 정적 배포된다.

---

## Environment

| 항목             | 설명                                                    |
| ---------------- | ------------------------------------------------------- |
| 플랫폼           | 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)   |
| 배포 환경        | Vercel (정적 호스팅)                                    |
| 디바이스         | 데스크톱, 태블릿, 모바일 (320px 이상 뷰포트)           |
| 네트워크         | 초기 로딩 후 오프라인 사용 가능 (클라이언트 사이드 전용)|
| 데이터 저장소    | 브라우저 localStorage                                   |

---

## Assumptions

1. 사용자는 최신 웹 브라우저(ES2020+ 지원)를 사용한다.
2. 명함 디자인은 고정된 비율(가로형 카드)을 따른다.
3. 이미지 업로드는 클라이언트 사이드에서만 처리되며, 외부 서버로 전송되지 않는다.
4. 사용자는 한 번에 하나의 명함만 편집한다.
5. localStorage에 충분한 저장 공간이 있다고 가정한다 (5MB 이내).
6. 아바타 이미지는 사용자가 직접 업로드하거나, 기본 일러스트레이션을 사용한다.

---

## Requirements

### Ubiquitous Requirements (항상 활성)

**REQ-U-001**: 시스템은 **항상** 명함의 앞면과 뒷면을 실시간 미리보기로 표시해야 한다.

**REQ-U-002**: 시스템은 **항상** 사용자 입력 데이터를 브라우저 로컬 스토리지에 자동 저장하여 페이지 새로고침 시에도 데이터를 유지해야 한다.

**REQ-U-003**: 시스템은 **항상** 반응형 레이아웃을 유지하여 320px 이상의 뷰포트에서 정상 작동해야 한다.

### Event-Driven Requirements (이벤트 기반)

**REQ-E-001**: **WHEN** 사용자가 이미지 파일을 업로드하면 **THEN** 시스템은 명함 앞면의 아바타 영역에 업로드된 이미지를 표시해야 한다.

**REQ-E-002**: **WHEN** 사용자가 배경색을 변경하면 **THEN** 시스템은 현재 선택된 면의 배경색을 즉시 업데이트해야 한다.

**REQ-E-003**: **WHEN** 사용자가 내보내기 버튼을 클릭하면 **THEN** 시스템은 명함 앞면과 뒷면을 각각 PNG 이미지로 생성하여 다운로드해야 한다.

**REQ-E-004**: **WHEN** 사용자가 텍스트 필드를 수정하면 **THEN** 시스템은 명함 미리보기를 실시간으로 업데이트해야 한다.

**REQ-E-005**: **WHEN** 사용자가 앞면/뒷면 전환 버튼을 클릭하면 **THEN** 시스템은 해당 면의 미리보기와 편집 패널을 전환하여 표시해야 한다.

### State-Driven Requirements (상태 기반)

**REQ-S-001**: **IF** 명함 앞면이 선택된 상태라면 **THEN** 시스템은 디스플레이 이름, 아바타 이미지 업로드, 앞면 배경색 편집 패널을 표시해야 한다.

**REQ-S-002**: **IF** 명함 뒷면이 선택된 상태라면 **THEN** 시스템은 전체 이름, 직함, 해시태그 목록, 소셜 미디어 링크 편집 패널을 표시해야 한다.

### Optional Requirements (선택 사항)

**REQ-O-001**: **가능하면** PDF 형식으로도 내보내기 기능을 제공한다.

**REQ-O-002**: **가능하면** 미리 정의된 명함 색상 템플릿 프리셋을 제공한다.

### Unwanted Behavior Requirements (금지 사항)

**REQ-N-001**: 시스템은 업로드된 이미지를 외부 서버로 전송**하지 않아야 한다** (클라이언트 사이드 전용).

**REQ-N-002**: 시스템은 5MB를 초과하는 이미지 업로드를 허용**하지 않아야 한다**.

---

## Specifications

### Technical Constraints

| 항목               | 기술 스택                                         |
| ------------------ | ------------------------------------------------- |
| Framework          | Next.js 16 (App Router)                           |
| Language           | TypeScript 5.9+                                   |
| Styling            | Tailwind CSS 4                                    |
| State Management   | Zustand 5 (localStorage persist middleware 포함)  |
| Color Picker       | react-colorful                                    |
| Image Export       | html-to-image                                     |
| Deployment         | Vercel (정적 배포)                                |
| Backend            | 없음 (순수 클라이언트 사이드 애플리케이션)        |

### Architecture Overview

```
namecard/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main editor page
│   └── globals.css         # Global styles (Tailwind)
├── components/
│   ├── editor/
│   │   ├── EditorPanel.tsx       # Edit form container
│   │   ├── FrontEditor.tsx       # Front side edit fields
│   │   └── BackEditor.tsx        # Back side edit fields
│   ├── preview/
│   │   ├── CardPreview.tsx       # Preview container
│   │   ├── FrontCard.tsx         # Front side preview
│   │   └── BackCard.tsx          # Back side preview
│   ├── common/
│   │   ├── ColorPicker.tsx       # Color picker wrapper
│   │   ├── ImageUploader.tsx     # Avatar image uploader
│   │   └── ExportButton.tsx      # PNG export button
│   └── ui/
│       └── SideToggle.tsx        # Front/Back toggle button
├── store/
│   └── useCardStore.ts    # Zustand store with persist
├── types/
│   └── card.ts            # TypeScript type definitions
├── lib/
│   └── export.ts          # html-to-image export utilities
└── public/
    └── default-avatar.svg # Default avatar illustration
```

### Data Model

```typescript
interface CardData {
  front: {
    displayName: string;
    avatarImage: string | null; // base64 data URL
    backgroundColor: string;   // hex color
  };
  back: {
    fullName: string;
    title: string;
    hashtags: string[];
    socialLinks: SocialLink[];
    backgroundColor: string;   // hex color
  };
}

interface SocialLink {
  platform: string;   // e.g., "github", "twitter", "linkedin"
  url: string;
}
```

### UI Layout

편집기 화면은 두 영역으로 구성된다:

1. **좌측 패널 (Editor Panel)**: 현재 선택된 면(앞면/뒷면)에 해당하는 입력 필드와 컨트롤을 표시
2. **우측 패널 (Preview Panel)**: 명함의 실시간 미리보기를 표시

모바일 환경에서는 상단에 미리보기, 하단에 편집 패널이 수직으로 배치된다.

### Performance Requirements

| 항목                     | 기준값          |
| ------------------------ | --------------- |
| 초기 로딩 시간 (LCP)    | 2초 이내        |
| 텍스트 입력 반영 지연    | 100ms 이내      |
| 이미지 내보내기 시간     | 3초 이내        |
| 번들 크기 (gzip)        | 200KB 이내      |

---

## Reference Design

참조 디자인은 비즈니스 명함 형태로, 두 면으로 구성된다:

### 앞면 (Front)

- **배경색**: 빨간색 계열 (#E53E3E 또는 유사 톤)
- **디스플레이 이름**: 카드 중앙 또는 상단에 큰 글씨로 표시
- **아바타**: 일러스트레이션 스타일의 프로필 이미지, 카드 하단 또는 중앙에 배치

### 뒷면 (Back)

- **배경색**: 진한 빨간색 계열 (#9B2C2C 또는 유사 톤)
- **전체 이름**: 상단에 표시
- **직함/역할**: 이름 아래에 표시
- **해시태그**: 관심사나 전문 분야를 해시태그 형태로 나열 (예: #Developer #Designer)
- **소셜 링크**: GitHub, Twitter, LinkedIn 등 소셜 미디어 아이콘과 URL

---

## Traceability

| SPEC ID      | 관련 요구사항                    | 구현 대상                          |
| ------------ | -------------------------------- | ---------------------------------- |
| SPEC-UI-001  | REQ-U-001, REQ-E-004, REQ-E-005 | CardPreview, FrontCard, BackCard   |
| SPEC-UI-001  | REQ-U-002                        | useCardStore (Zustand persist)     |
| SPEC-UI-001  | REQ-U-003                        | Tailwind responsive layout         |
| SPEC-UI-001  | REQ-E-001                        | ImageUploader                      |
| SPEC-UI-001  | REQ-E-002                        | ColorPicker                        |
| SPEC-UI-001  | REQ-E-003                        | ExportButton, export.ts            |
| SPEC-UI-001  | REQ-S-001, REQ-S-002             | EditorPanel, SideToggle            |
| SPEC-UI-001  | REQ-N-001, REQ-N-002             | ImageUploader (validation)         |
| SPEC-UI-001  | REQ-O-001                        | export.ts (PDF export - optional)  |
| SPEC-UI-001  | REQ-O-002                        | ColorPicker (presets - optional)   |
