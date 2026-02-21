# 프로젝트 구조

## 디렉토리 트리

```
namecard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (metadata, global styles, lang="ko")
│   │   ├── page.tsx                  # Main editor page (2-column responsive layout)
│   │   └── globals.css               # Tailwind CSS 4 imports + custom animations + accessibility styles
│   ├── components/
│   │   ├── card/                     # Card preview components
│   │   │   ├── CardFront.tsx         # 앞면 렌더링 (Display Name + Avatar Image)
│   │   │   ├── CardBack.tsx          # 뒷면 렌더링 (Full Name + Title + Hashtags + Social Links)
│   │   │   └── CardPreview.tsx       # Preview container (앞면/뒷면 전환, 플립 애니메이션)
│   │   ├── editor/                   # Editor form components
│   │   │   ├── EditorPanel.tsx       # Editor panel container (activeSide에 따라 FrontEditor/BackEditor 렌더링)
│   │   │   ├── FrontEditor.tsx       # 앞면 편집 필드 (Display Name, ImageUploader, ColorPicker)
│   │   │   ├── BackEditor.tsx        # 뒷면 편집 필드 (Full Name, Title, HashtagEditor, SocialLinkEditor, ColorPicker)
│   │   │   ├── ImageUploader.tsx     # 이미지 업로드 (Drag & Drop, 파일 선택, 5MB 제한, Base64 변환)
│   │   │   ├── ColorPicker.tsx       # react-colorful wrapper (HexColorPicker + Hex 직접 입력)
│   │   │   ├── HashtagEditor.tsx     # Hashtag 태그 관리 (추가/삭제, Enter 키 지원)
│   │   │   └── SocialLinkEditor.tsx  # Social Link CRUD (5개 플랫폼, 인라인 편집/삭제)
│   │   ├── export/
│   │   │   └── ExportButton.tsx      # PNG 내보내기 버튼 (앞면/뒷면 각각 다운로드, 2x 해상도)
│   │   └── ui/
│   │       ├── TabSwitch.tsx         # 앞면/뒷면 탭 전환 (ARIA tablist/tab 패턴)
│   │       └── ResetButton.tsx       # 초기화 버튼 (확인 단계 포함)
│   ├── stores/
│   │   ├── useCardStore.ts           # Zustand store (persist middleware, localStorage 자동 저장)
│   │   └── __tests__/
│   │       └── useCardStore.test.ts  # Store 단위 테스트
│   ├── types/
│   │   └── card.ts                   # TypeScript 타입 정의 (CardData, CardFrontData, CardBackData, SocialLink, CardSide)
│   ├── lib/
│   │   ├── export.ts                 # html-to-image 기반 PNG 내보내기 유틸리티 (pixelRatio: 2)
│   │   └── validation.ts            # 이미지 파일 검증 (형식, 크기) + Base64 변환
│   └── test/
│       └── setup.ts                  # Vitest 테스트 환경 설정
├── .moai/                            # MoAI-ADK 설정
│   ├── config/                       # 프로젝트 설정 파일
│   │   └── sections/                 # 설정 섹션 (quality, user, language)
│   ├── project/                      # 프로젝트 문서
│   └── specs/                        # SPEC 문서
│       └── SPEC-UI-001/              # Namecard Editor SPEC
├── .claude/                          # Claude Code 설정
│   ├── agents/                       # Sub-agent 정의
│   ├── commands/                     # Slash commands
│   ├── rules/                        # Project rules
│   │   └── moai/                     # MoAI-specific rules
│   └── skills/                       # Skills 정의
├── _AEC/                             # 참조용 디자인 에셋
├── public/                           # Static assets
├── package.json                      # 프로젝트 의존성 및 스크립트
├── tsconfig.json                     # TypeScript 설정
├── next.config.ts                    # Next.js 설정
├── postcss.config.mjs                # PostCSS 설정 (Tailwind CSS 4)
├── eslint.config.mjs                 # ESLint 9 설정
├── vitest.config.mts                 # Vitest 테스트 설정
└── CLAUDE.md                         # MoAI Execution Directive
```

## 아키텍처 패턴

### Client-side SPA with Next.js App Router

이 프로젝트는 Next.js 16의 App Router를 사용하는 순수 클라이언트 사이드 싱글 페이지 애플리케이션(SPA)입니다. 서버 사이드 렌더링(SSR)이나 API Routes는 사용하지 않으며, 모든 컴포넌트가 `'use client'` 지시문을 사용합니다.

### 데이터 흐름

```
User Input -> Zustand Store (useCardStore) -> React Components (실시간 렌더링)
     |                |
     |                +--> localStorage (persist middleware, 자동 저장)
     |
     +--> html-to-image -> PNG 다운로드 (내보내기)
```

1. 사용자가 Editor 컴포넌트에서 입력하면 Zustand Store가 즉시 업데이트됩니다.
2. Store 변경은 Card Preview 컴포넌트에 실시간으로 반영됩니다.
3. Zustand의 persist middleware가 모든 상태 변경을 localStorage에 자동 저장합니다.
4. 내보내기 시 html-to-image가 DOM 요소를 캡처하여 PNG로 변환합니다.

### 백엔드 없음 - 순수 클라이언트 사이드 애플리케이션

- 데이터 저장: localStorage (Zustand persist)
- 이미지 처리: 브라우저 FileReader API (Base64 인코딩)
- 이미지 생성: html-to-image (DOM-to-PNG 변환)
- 인증/인가: 없음
- API 호출: 없음

## 컴포넌트 계층 구조

```
page.tsx (Home)
├── CardPreview
│   ├── CardFront          # 앞면 미리보기
│   └── CardBack           # 뒷면 미리보기
├── TabSwitch              # 앞면/뒷면 탭 전환
├── EditorPanel
│   ├── FrontEditor        # 앞면 편집
│   │   ├── ImageUploader  # 이미지 업로드
│   │   └── ColorPicker    # 배경색 선택
│   └── BackEditor         # 뒷면 편집
│       ├── HashtagEditor  # 해시태그 관리
│       ├── SocialLinkEditor # 소셜 링크 관리
│       └── ColorPicker    # 배경색 선택
├── ExportButton           # PNG 내보내기
└── ResetButton            # 초기화
```

## 주요 디렉토리 설명

| 디렉토리 | 설명 |
|----------|------|
| `src/app/` | Next.js App Router 기반 페이지 및 레이아웃 |
| `src/components/card/` | 명함 미리보기 렌더링 컴포넌트 |
| `src/components/editor/` | 명함 편집 폼 컴포넌트 |
| `src/components/export/` | PNG 이미지 내보내기 관련 컴포넌트 |
| `src/components/ui/` | 범용 UI 컴포넌트 (탭, 버튼) |
| `src/stores/` | Zustand 상태 관리 (localStorage persist 포함) |
| `src/types/` | TypeScript 타입 정의 |
| `src/lib/` | 유틸리티 함수 (내보내기, 검증) |
| `src/test/` | 테스트 환경 설정 |

## 파일 수 현황

| 카테고리 | 파일 수 |
|---------|--------|
| React 컴포넌트 (`.tsx`) | 15 |
| TypeScript 모듈 (`.ts`) | 6 |
| 총 소스 파일 | 21 |
